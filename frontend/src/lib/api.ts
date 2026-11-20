const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export type Plan = "pilot" | "full" | "enterprise";
export type Currency = "AED" | "USD";
export type PaymentMethod = "card" | "invoice";

export interface OnboardingPayload {
  university_name: string;
  slug: string;
  contact_name: string;
  email: string;
  role: string;
  plan: Plan;
  estimated_rooms: number;
  estimated_buildings: number;
  currency: Currency;
  payment_method: PaymentMethod;
}

export interface ProvisioningResult {
  request_id: string;
  tenant_id: string;
  slug: string;
  status: string;
  payment_status: string;
  admin_setup_token: string;
  university_name: string;
  plan: Plan;
  currency: Currency;
  estimated_rooms: number;
  estimated_buildings: number;
  preview_expires_at: string | null;
}

export interface OnboardingResult extends ProvisioningResult {
  payment_method: PaymentMethod;
  invoice_reference: string | null;
}

export interface Tenant {
  id: string;
  university_name: string;
  slug: string;
  plan: Plan;
  status: string;
  estimated_rooms: number;
  estimated_buildings: number;
  currency: Currency;
  admin_setup_token: string;
  sandbox_expires_at?: string | null;
}

export interface AdminRequest {
  id: string;
  contact_name: string;
  email: string;
  role: string;
  payment_method: PaymentMethod;
  payment_status: string;
  invoice_reference: string | null;
  created_at: string;
  tenant: Tenant;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Could not reach the CampuSyncer API. Make sure the backend is running.");
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail || `Request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export const checkSlug = (slug: string) =>
  request<{ slug: string; available: boolean; valid: boolean; url: string; message: string }>(
    `/api/tenants/check-slug/${encodeURIComponent(slug)}`,
  );

export const submitOnboarding = (payload: OnboardingPayload) =>
  request<OnboardingResult>("/api/onboarding/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createCheckout = (requestId: string) =>
  request<{ checkout_url: string; mode: "stripe" | "demo" }>("/api/payments/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ request_id: requestId }),
  });

export const confirmDemoPayment = (requestId: string) =>
  request<ProvisioningResult>(`/api/payments/demo-confirm/${requestId}`, {
    method: "POST",
  });

export const getCheckoutStatus = (sessionId: string) =>
  request<{ paid: boolean } & ProvisioningResult>(`/api/payments/checkout-status/${encodeURIComponent(sessionId)}`);

export const getAdminRequests = (pin: string) =>
  request<AdminRequest[]>("/api/admin/requests", { headers: { "X-Admin-Pin": pin } });

export const activateInvoiceRequest = (requestId: string, pin: string) =>
  request<{ status: string; payment_status: string }>(`/api/admin/requests/${requestId}/activate`, {
    method: "POST",
    headers: { "X-Admin-Pin": pin },
  });