from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OnboardingRequest, Tenant
from ..schemas import OnboardingCreate, OnboardingResult, SLUG_PATTERN


router = APIRouter(tags=["onboarding"])
RESERVED_SLUGS = {
    "www", "api", "admin", "uedubai", "app", "mail", "support", "help",
    "billing", "status", "cdn", "static", "assets", "login", "signup",
}


def slug_is_available(slug: str, db: Session) -> bool:
    return slug not in RESERVED_SLUGS and db.scalar(
        select(Tenant.id).where(Tenant.slug == slug)
    ) is None


@router.get("/tenants/check-slug/{slug}")
def check_slug(slug: str, db: Session = Depends(get_db)):
    normalized = slug.strip().lower()
    valid = bool(SLUG_PATTERN.fullmatch(normalized))
    available = valid and slug_is_available(normalized, db)
    message = (
        "Available"
        if available
        else "This subdomain is reserved"
        if normalized in RESERVED_SLUGS
        else "This subdomain is already taken"
        if valid
        else "Use 2-63 lowercase letters, numbers, or hyphens"
    )
    return {
        "slug": normalized,
        "available": available,
        "valid": valid,
        "url": f"{normalized}.campusync.net",
        "message": message,
    }


def _invoice_reference(db: Session) -> str:
    prefix = f"CS-INV-{datetime.now().year}-"
    latest = db.scalar(
        select(OnboardingRequest.invoice_reference)
        .where(OnboardingRequest.invoice_reference.like(f"{prefix}%"))
        .order_by(OnboardingRequest.invoice_reference.desc())
        .limit(1)
    )
    sequence = int(latest.rsplit("-", 1)[1]) + 1 if latest else 1
    return f"{prefix}{sequence:04d}"


@router.post("/onboarding/submit", response_model=OnboardingResult, status_code=201)
def submit_onboarding(payload: OnboardingCreate, db: Session = Depends(get_db)):
    if not slug_is_available(payload.slug, db):
        raise HTTPException(status_code=409, detail="That subdomain is unavailable.")

    is_invoice = payload.payment_method == "invoice"
    tenant = Tenant(
        id=str(uuid4()),
        university_name=payload.university_name,
        slug=payload.slug,
        plan=payload.plan,
        status="SANDBOX_PROVISIONED" if is_invoice else "PENDING_PAYMENT",
        estimated_rooms=payload.estimated_rooms,
        estimated_buildings=payload.estimated_buildings,
        currency=payload.currency,
        sandbox_expires_at=(
            datetime.now(timezone.utc) + timedelta(days=14) if is_invoice else None
        ),
    )
    request = OnboardingRequest(
        id=str(uuid4()),
        tenant=tenant,
        contact_name=payload.contact_name,
        email=str(payload.email),
        role=payload.role,
        payment_method=payload.payment_method,
        payment_status="PENDING_INVOICE" if is_invoice else "UNPAID",
    )
    try:
        db.add(request)
        if is_invoice:
            request.invoice_reference = _invoice_reference(db)
        db.commit()
        db.refresh(request)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="That subdomain was just claimed. Please choose another.") from exc

    return OnboardingResult(
        request_id=request.id,
        tenant_id=tenant.id,
        slug=tenant.slug,
        status=tenant.status,
        payment_status=request.payment_status,
        payment_method=request.payment_method,
        invoice_reference=request.invoice_reference,
        admin_setup_token=tenant.admin_setup_token,
        university_name=tenant.university_name,
        plan=tenant.plan,
        currency=tenant.currency,
        estimated_rooms=tenant.estimated_rooms,
        estimated_buildings=tenant.estimated_buildings,
        preview_expires_at=tenant.sandbox_expires_at.isoformat() if tenant.sandbox_expires_at else None,
    )