from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    university_name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(63), unique=True, index=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING_PAYMENT")
    estimated_rooms: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    estimated_buildings: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="AED")
    admin_setup_token: Mapped[str] = mapped_column(String(48), nullable=False, default=lambda: uuid4().hex)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    sandbox_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    onboarding_request: Mapped["OnboardingRequest | None"] = relationship(
        back_populates="tenant", uselist=False
    )


class OnboardingRequest(Base):
    __tablename__ = "onboarding_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False)
    contact_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    role: Mapped[str] = mapped_column(String(80), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(16), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(32), nullable=False, default="UNPAID")
    invoice_reference: Mapped[str | None] = mapped_column(String(32), unique=True)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    tenant: Mapped[Tenant] = relationship(back_populates="onboarding_request")