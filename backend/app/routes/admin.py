import hmac
import os

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import OnboardingRequest
from ..schemas import ActivationResult, RequestView


router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(x_admin_pin: str | None = Header(default=None, alias="X-Admin-Pin")):
    expected = os.getenv("ADMIN_PIN", "vortex2026")
    if not x_admin_pin or not hmac.compare_digest(x_admin_pin, expected):
        raise HTTPException(status_code=401, detail="Invalid admin PIN.")


@router.get("/requests", response_model=list[RequestView], dependencies=[Depends(require_admin)])
def list_requests(db: Session = Depends(get_db)):
    requests = db.scalars(
        select(OnboardingRequest)
        .options(joinedload(OnboardingRequest.tenant))
        .order_by(OnboardingRequest.created_at.desc())
    ).all()
    return [
        RequestView(
            id=item.id,
            contact_name=item.contact_name,
            email=item.email,
            role=item.role,
            payment_method=item.payment_method,
            payment_status=item.payment_status,
            invoice_reference=item.invoice_reference,
            created_at=item.created_at.isoformat(),
            tenant=item.tenant,
        )
        for item in requests
    ]


@router.post(
    "/requests/{request_id}/activate",
    response_model=ActivationResult,
    dependencies=[Depends(require_admin)],
)
def activate_request(request_id: str, db: Session = Depends(get_db)):
    request_row = db.scalar(
        select(OnboardingRequest)
        .options(joinedload(OnboardingRequest.tenant))
        .where(OnboardingRequest.id == request_id)
    )
    if request_row is None:
        raise HTTPException(status_code=404, detail="Onboarding request not found.")
    if request_row.payment_method != "invoice":
        raise HTTPException(status_code=409, detail="Only invoice requests can be activated here.")
    request_row.payment_status = "APPROVED"
    request_row.tenant.status = "ACTIVE"
    db.commit()
    return ActivationResult(
        request_id=request_row.id,
        tenant_id=request_row.tenant_id,
        status=request_row.tenant.status,
        payment_status=request_row.payment_status,
    )