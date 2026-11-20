import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


SLUG_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$")


class OnboardingCreate(BaseModel):
    university_name: str = Field(min_length=2, max_length=200)
    slug: str = Field(min_length=2, max_length=63)
    contact_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    role: str = Field(min_length=2, max_length=80)
    plan: Literal["pilot", "full", "enterprise"]
    estimated_rooms: int = Field(default=25, ge=1, le=100000)
    estimated_buildings: int = Field(default=1, ge=1, le=1000)
    currency: Literal["AED", "USD"] = "AED"
    payment_method: Literal["card", "invoice"]

    @field_validator("slug")
    @classmethod
    def validate_slug_format(cls, value: str) -> str:
        value = value.strip().lower()
        if not SLUG_PATTERN.fullmatch(value):
            raise ValueError("Use lowercase letters, numbers, and hyphens; start and end with a letter or number.")
        return value

    @field_validator("university_name", "contact_name", "role")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


class OnboardingResult(BaseModel):
    request_id: str
    tenant_id: str
    slug: str
    status: str
    payment_status: str
    payment_method: str
    invoice_reference: str | None = None
    admin_setup_token: str
    university_name: str
    plan: str
    currency: str
    estimated_rooms: int
    estimated_buildings: int
    preview_expires_at: str | None = None


class CheckoutCreate(BaseModel):
    request_id: str


class CheckoutResult(BaseModel):
    checkout_url: str
    mode: Literal["stripe", "demo"]


class TenantView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    university_name: str
    slug: str
    plan: str
    status: str
    estimated_rooms: int
    estimated_buildings: int
    currency: str
    admin_setup_token: str
    sandbox_expires_at: datetime | None = None


class RequestView(BaseModel):
    id: str
    contact_name: str
    email: str
    role: str
    payment_method: str
    payment_status: str
    invoice_reference: str | None
    created_at: str
    tenant: TenantView


class ActivationResult(BaseModel):
    request_id: str
    tenant_id: str
    status: str
    payment_status: str