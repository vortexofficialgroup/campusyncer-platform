import os
from urllib.parse import urlencode

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OnboardingRequest
from ..schemas import CheckoutCreate, CheckoutResult


router = APIRouter(prefix="/payments", tags=["payments"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
PLAN_AMOUNTS_AED = {"pilot": 150000, "full": 450000, "enterprise": 1200000}


def _frontend_url() -> str:
    configured_url = os.getenv("FRONTEND_URL")
    if configured_url:
        return configured_url.rstrip("/")
    deployment_url = os.getenv("VERCEL_URL")
    if deployment_url:
        return f"https://{deployment_url.removeprefix('https://').rstrip('/')}"
    return "http://localhost:5173"


def _activate(request_row: OnboardingRequest, db: Session) -> None:
    request_row.payment_status = "PAID"
    request_row.tenant.status = "ACTIVE"
    db.commit()


@router.post("/create-checkout-session", response_model=CheckoutResult)
def create_checkout_session(payload: CheckoutCreate, db: Session = Depends(get_db)):
    request_row = db.scalar(
        select(OnboardingRequest).where(OnboardingRequest.id == payload.request_id)
    )
    if request_row is None:
        raise HTTPException(status_code=404, detail="Onboarding request not found.")
    if request_row.payment_method != "card":
        raise HTTPException(status_code=409, detail="This request was submitted for invoice payment.")
    if request_row.payment_status == "PAID":
        raise HTTPException(status_code=409, detail="This request has already been paid.")

    if not stripe.api_key:
        params = urlencode({"request_id": request_row.id, "demo": "1"})
        return CheckoutResult(checkout_url=f"{_frontend_url()}/checkout-success?{params}", mode="demo")

    amount = PLAN_AMOUNTS_AED.get(request_row.tenant.plan)
    if request_row.tenant.currency == "USD":
        amount = round((amount or 0) * 0.2723)
    if amount is None:
        raise HTTPException(status_code=400, detail="Unsupported plan.")
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer_email=request_row.email,
            line_items=[{
                "price_data": {
                    "currency": request_row.tenant.currency.lower(),
                    "unit_amount": amount,
                    "recurring": {"interval": "month"},
                    "product_data": {"name": f"CampuSyncer {request_row.tenant.plan.title()} Campus Plan"},
                },
                "quantity": 1,
            }],
            metadata={"request_id": request_row.id},
            success_url=f"{_frontend_url()}/checkout-success?session_id={{CHECKOUT_SESSION_ID}}&request_id={request_row.id}",
            cancel_url=f"{_frontend_url()}/?checkout=cancelled",
        )
    except stripe.StripeError as exc:
        raise HTTPException(status_code=502, detail="Stripe could not create a checkout session.") from exc
    request_row.stripe_session_id = session.id
    request_row.payment_status = "CHECKOUT_PENDING"
    db.commit()
    return CheckoutResult(checkout_url=session.url, mode="stripe")


@router.post("/demo-confirm/{request_id}")
def demo_confirm(request_id: str, db: Session = Depends(get_db)):
    if stripe.api_key:
        raise HTTPException(status_code=409, detail="Demo confirmation is only available when Stripe is not configured.")
    request_row = db.scalar(
        select(OnboardingRequest).where(OnboardingRequest.id == request_id)
    )
    if request_row is None:
        raise HTTPException(status_code=404, detail="Onboarding request not found.")
    if request_row.payment_method != "card":
        raise HTTPException(status_code=409, detail="Only card requests can be confirmed as demo payments.")
    if request_row.payment_status != "PAID":
        _activate(request_row, db)
    return {
        "request_id": request_row.id,
        "tenant_id": request_row.tenant_id,
        "slug": request_row.tenant.slug,
        "status": request_row.tenant.status,
        "payment_status": request_row.payment_status,
        "admin_setup_token": request_row.tenant.admin_setup_token,
        "university_name": request_row.tenant.university_name,
        "plan": request_row.tenant.plan,
        "currency": request_row.tenant.currency,
        "estimated_rooms": request_row.tenant.estimated_rooms,
        "estimated_buildings": request_row.tenant.estimated_buildings,
        "preview_expires_at": (
            request_row.tenant.sandbox_expires_at.isoformat()
            if request_row.tenant.sandbox_expires_at else None
        ),
    }


@router.get("/checkout-status/{session_id}")
def checkout_status(session_id: str, db: Session = Depends(get_db)):
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe is not configured.")
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as exc:
        raise HTTPException(status_code=502, detail="Could not verify the Stripe checkout session.") from exc
    request_id = session.get("metadata", {}).get("request_id")
    request_row = db.scalar(
        select(OnboardingRequest).where(OnboardingRequest.id == request_id)
    ) if request_id else None
    if request_row is None or request_row.stripe_session_id != session_id:
        raise HTTPException(status_code=404, detail="Checkout request not found.")
    if session.get("payment_status") == "paid" and request_row.payment_status != "PAID":
        _activate(request_row, db)
    return {
        "paid": request_row.payment_status == "PAID",
        "request_id": request_row.id,
        "tenant_id": request_row.tenant_id,
        "slug": request_row.tenant.slug,
        "status": request_row.tenant.status,
        "payment_status": request_row.payment_status,
        "admin_setup_token": request_row.tenant.admin_setup_token,
        "university_name": request_row.tenant.university_name,
        "plan": request_row.tenant.plan,
        "currency": request_row.tenant.currency,
        "estimated_rooms": request_row.tenant.estimated_rooms,
        "estimated_buildings": request_row.tenant.estimated_buildings,
        "preview_expires_at": None,
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe webhook signing is not configured.")
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header.")
    body = await request.body()
    try:
        event = stripe.Webhook.construct_event(body, stripe_signature, secret)
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook signature or payload.") from exc

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        request_id = session.get("metadata", {}).get("request_id")
        request_row = db.scalar(
            select(OnboardingRequest).where(OnboardingRequest.id == request_id)
        ) if request_id else None
        if request_row is None:
            raise HTTPException(status_code=404, detail="Checkout request not found.")
        if request_row.stripe_session_id and request_row.stripe_session_id != session.get("id"):
            raise HTTPException(status_code=400, detail="Checkout session does not match the request.")
        if session.get("payment_status") == "paid" and request_row.payment_status != "PAID":
            _activate(request_row, db)
    return {"received": True}