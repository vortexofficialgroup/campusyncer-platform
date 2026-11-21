import hmac
import hashlib
import os
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OnboardingRequest
from ..schemas import CheckoutCreate, CheckoutResult

router = APIRouter(prefix="/payments", tags=["payments"])

WHOP_CHECKOUT_URLS = {
    "pilot": "https://whop.com/campusyncer-platform/campusyncer-pilot/",
    "full": "https://whop.com/campusyncer-platform/campusyncer-full-campus/",
    "enterprise": None,  # Talk to our team — no direct checkout
}

WHOP_WEBHOOK_SECRET = os.getenv("WHOP_WEBHOOK_SECRET", "")


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

    plan = request_row.tenant.plan
    whop_url = WHOP_CHECKOUT_URLS.get(plan)

    if whop_url is None:
        # Enterprise — send them to email
        return CheckoutResult(
            checkout_url=f"mailto:hello@campusyncer.com?subject=Multi-Campus Enquiry&body=University: {request_row.tenant.university_name}",
            mode="enterprise"
        )

    # Append request_id so we can activate after payment
    checkout_url = f"{whop_url}?ref={request_row.id}"
    request_row.payment_status = "CHECKOUT_PENDING"
    db.commit()
    return CheckoutResult(checkout_url=checkout_url, mode="whop")


@router.post("/demo-confirm/{request_id}")
def demo_confirm(request_id: str, db: Session = Depends(get_db)):
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


@router.post("/whop-webhook")
async def whop_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    body = await request.body()

    if WHOP_WEBHOOK_SECRET:
        signature = request.headers.get("whop-signature", "")
        expected = hmac.new(
            WHOP_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    data = await request.json()
    action = data.get("action")

    if action == "payment.completed":
        membership = data.get("data", {})
        # ref is the request_id we passed in the checkout URL
        ref = membership.get("metadata", {}).get("ref") or membership.get("checkout", {}).get("ref")
        if ref:
            request_row = db.scalar(
                select(OnboardingRequest).where(OnboardingRequest.id == ref)
            )
            if request_row and request_row.payment_status != "PAID":
                _activate(request_row, db)

    return {"received": True}