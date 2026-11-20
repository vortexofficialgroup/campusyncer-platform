import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, CreditCard, FileText, LoaderCircle, LockKeyhole, Plus, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { checkSlug, createCheckout, submitOnboarding, type Currency, type OnboardingPayload, type OnboardingResult, type Plan, type Tenant } from "../lib/api";
import { BrandWordmark } from "./BrandLockup";

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  initialPlan?: Plan;
  onTenantReady?: (tenant: Tenant) => void;
}

const steps = ["Institution", "Campus scale", "Payment", "Provisioned"];
const initialForm = {
  university_name: "",
  slug: "",
  contact_name: "",
  email: "",
  role: "IT Director",
  plan: "full" as Plan,
  estimated_rooms: 120,
  estimated_buildings: 1,
  currency: "AED" as Currency,
};

const planLabels: Record<Plan, string> = { pilot: "Pilot / Department", full: "Full Campus", enterprise: "Multi-Campus Enterprise" };

export default function OnboardingWizard({ open, onClose, initialPlan, onTenantReady }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [slugState, setSlugState] = useState<{ available: boolean; message: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "invoice">("card");
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm({ ...initialForm, ...(initialPlan ? { plan: initialPlan } : {}) });
    setSlugState(null);
    setResult(null);
    setTenant(null);
    setError("");
  }, [open, initialPlan]);

  useEffect(() => {
    const slug = form.slug.trim().toLowerCase();
    if (!open || slug.length < 2) {
      setSlugState(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const status = await checkSlug(slug);
        if (active) setSlugState({ available: status.available, message: status.message });
      } catch {
        if (active) setSlugState({ available: false, message: "Availability check unavailable. Try again shortly." });
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.slug, open]);

  if (!open) return null;

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };
  const makeTenant = (created: OnboardingResult): Tenant => ({
    id: created.tenant_id,
    university_name: form.university_name,
    slug: created.slug,
    plan: form.plan,
    status: created.status,
    estimated_rooms: form.estimated_rooms,
    estimated_buildings: form.estimated_buildings,
    currency: form.currency,
    admin_setup_token: created.admin_setup_token,
    sandbox_expires_at: created.preview_expires_at,
  });

  const continueFromInstitution = (event: FormEvent) => {
    event.preventDefault();
    if (!slugState?.available) {
      setError("Choose an available campus subdomain to continue.");
      return;
    }
    setStep(2);
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const payload: OnboardingPayload = {
        ...form,
        slug: form.slug.trim().toLowerCase(),
        payment_method: paymentMethod,
      };
      const created = result ?? await submitOnboarding(payload);
      if (!result) setResult(created);
      if (paymentMethod === "invoice") {
        const provisioned = makeTenant(created);
        setTenant(provisioned);
        onTenantReady?.(provisioned);
        setStep(4);
        return;
      }
      const checkout = await createCheckout(created.request_id);
      window.location.assign(checkout.checkout_url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit onboarding request.");
      setBusy(false);
    }
  };

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <div className="modal-backdrop wizard-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <button className="icon-button modal-close" onClick={close} aria-label="Close onboarding"><X size={19} /></button>
        <div className="wizard-header">
          <div className="wizard-brand"><BrandWordmark /><span>Campus deployment</span></div>
          <span className="wizard-counter">STEP {step.toString().padStart(2, "0")} <i>/ 04</i></span>
        </div>
        <div className="wizard-progress">{steps.map((label, index) => <div key={label} className={`wizard-progress-step ${step >= index + 1 ? "progress-done" : ""}`}><span>{step > index + 1 ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div>
        {step === 1 && <form onSubmit={continueFromInstitution}>
          <div className="wizard-intro"><span className="eyebrow">YOUR UNIVERSITY, CONNECTED</span><h2 id="wizard-title">Let&apos;s set up your campus.</h2><p>Start with your institution details and choose your campus URL.</p></div>
          <label className="field-label">University name<input required minLength={2} maxLength={200} value={form.university_name} onChange={(event) => update("university_name", event.target.value)} placeholder="Middlesex University Dubai" /></label>
          <div className="field-two-col">
            <label className="field-label">Contact person<input required minLength={2} value={form.contact_name} onChange={(event) => update("contact_name", event.target.value)} placeholder="Your full name" /></label>
            <label className="field-label">Your role<select value={form.role} onChange={(event) => update("role", event.target.value)}><option>IT Director</option><option>Facilities</option><option>Dean</option><option>Administrator</option><option>Other</option></select></label>
          </div>
          <label className="field-label">Official university email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@university.ac.ae" /><small>We recommend using your .ac.ae or .edu address.</small></label>
          <label className="field-label">Choose your campus subdomain<div className="slug-input-wrap"><input required minLength={2} value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="your-campus" /><span>.campusyncer.com</span></div>{slugState && <small className={slugState.available ? "field-success" : "field-error"}>{slugState.available ? <Check size={13} /> : <X size={13} />}{slugState.message}{slugState.available ? " — your URL is ready" : ""}</small>}</label>
          <div className="wizard-actions"><span className="secure-note"><LockKeyhole size={13} /> Secure institution setup</span><button className="button button-primary" type="submit">Continue <ArrowRight size={16} /></button></div>
        </form>}
        {step === 2 && <div>
          <div className="wizard-intro"><span className="eyebrow">BUILT AROUND YOUR CAMPUS</span><h2 id="wizard-title">Find your starting point.</h2><p>Choose a plan now. You can scale or change it later.</p></div>
          <div className="wizard-plan-list">{(["pilot", "full", "enterprise"] as Plan[]).map((plan) => <button key={plan} className={`wizard-plan ${form.plan === plan ? "wizard-plan-selected" : ""}`} onClick={() => update("plan", plan)}><span className="plan-radio">{form.plan === plan && <i />}</span><span className="wizard-plan-copy"><strong>{planLabels[plan]}</strong><small>{plan === "pilot" ? "Up to 25 rooms · one floor plan" : plan === "full" ? "Unlimited rooms · schedule sync" : "Multiple campuses · dedicated SLA"}</small></span><span className="wizard-plan-price">{plan === "pilot" ? "1,500" : plan === "full" ? "4,500" : "12,000+"}<small> AED / mo</small></span></button>)}</div>
          <div className="field-two-col scale-fields"><label className="field-label">Estimated rooms<input type="number" min={1} max={100000} value={form.estimated_rooms} onChange={(event) => update("estimated_rooms", Number(event.target.value))} /></label><label className="field-label">Campus buildings<input type="number" min={1} max={1000} value={form.estimated_buildings} onChange={(event) => update("estimated_buildings", Number(event.target.value))} /></label></div>
          <div className="currency-choice"><span>Billing currency</span><div><button className={form.currency === "AED" ? "choice-active" : ""} onClick={() => update("currency", "AED")}>AED</button><button className={form.currency === "USD" ? "choice-active" : ""} onClick={() => update("currency", "USD")}>USD</button></div></div>
          <div className="wizard-actions"><button className="button button-quiet" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button><button className="button button-primary" onClick={() => { if (!form.estimated_rooms || !form.estimated_buildings) { setError("Enter at least one room and one building."); return; } setStep(3); }}>Continue <ArrowRight size={16} /></button></div>
        </div>}
        {step === 3 && <div>
          <div className="wizard-intro"><span className="eyebrow">FLEXIBLE PROCUREMENT</span><h2 id="wizard-title">How would you like to begin?</h2><p>Pay by card to activate instantly, or request an institutional invoice.</p></div>
          <div className="payment-options">
            <button className={`payment-option ${paymentMethod === "card" ? "payment-option-active" : ""}`} onClick={() => setPaymentMethod("card")}><span className="payment-icon"><CreditCard size={19} /></span><span><strong>Instant card activation</strong><small>Secure checkout · Demo mode available</small></span><span className="plan-radio">{paymentMethod === "card" && <i />}</span></button>
            <button className={`payment-option ${paymentMethod === "invoice" ? "payment-option-active" : ""}`} onClick={() => setPaymentMethod("invoice")}><span className="payment-icon"><FileText size={19} /></span><span><strong>Invoice / Purchase Order</strong><small>14-day sandbox preview · procurement-ready</small></span><span className="plan-radio">{paymentMethod === "invoice" && <i />}</span></button>
          </div>
          <div className="order-summary"><span>{planLabels[form.plan]} <small>· {form.estimated_rooms} rooms</small></span><strong>{form.currency} {form.plan === "pilot" ? (form.currency === "AED" ? "1,500" : "410") : form.plan === "full" ? (form.currency === "AED" ? "4,500" : "1,225") : (form.currency === "AED" ? "12,000+" : "3,270+")}<small> / month</small></strong></div>
          <div className="wizard-actions"><button className="button button-quiet" onClick={() => setStep(2)} disabled={busy || Boolean(result)}><ArrowLeft size={15} /> Back</button><button className="button button-primary" onClick={submit} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={16} /> Preparing...</> : paymentMethod === "card" ? <>Continue to checkout <ArrowRight size={16} /></> : <>Request invoice <ArrowRight size={16} /></>}</button></div>
        </div>}
        {step === 4 && result && tenant && <div className="provisioned-step">
          <span className="success-orbit"><BadgeCheck size={32} /></span>
          <span className="eyebrow">{paymentMethod === "invoice" ? "SANDBOX READY" : "CAMPUS PROVISIONED"}</span>
          <h2 id="wizard-title">{paymentMethod === "invoice" ? "Your campus preview is live." : "Your campus is in sync."}</h2>
          <p>Your private campus workspace has been set up. Share this secure setup token with your university admin.</p>
          <div className="provision-card"><div className="provision-card-heading"><span className="mini-mark">C</span><div><strong>{tenant.university_name}</strong><small>{tenant.slug}.campusyncer.com</small></div>          <span className={`status-pill ${tenant.status === "ACTIVE" ? "status-active" : "status-sandbox"}`}>{tenant.status.replace(/_/g, " ")}</span></div><div className="provision-details"><span><Building2 size={15} /> {tenant.estimated_buildings} {tenant.estimated_buildings === 1 ? "building" : "buildings"}</span><span><Plus size={15} /> {tenant.estimated_rooms} rooms</span><span><ShieldCheck size={15} /> {planLabels[tenant.plan]}</span></div><div className="token-display"><small>ADMIN SETUP TOKEN</small><code>{tenant.admin_setup_token}</code></div></div>
          {paymentMethod === "invoice" && <div className="invoice-print"><div className="invoice-head"><span>CAMPUSYNC <small>BY VORTEX GROUP</small></span><strong>PRO-FORMA INVOICE</strong></div><p><b>Reference:</b> {result.invoice_reference}<br /><b>Prepared for:</b> {tenant.university_name}<br /><b>Contact:</b> {form.contact_name} · {form.email}<br /><b>Plan:</b> {planLabels[form.plan]}<br /><b>Monthly subscription:</b> {form.currency} {form.plan === "pilot" ? "1,500" : form.plan === "full" ? "4,500" : "12,000+"}</p><small>Sandbox preview provisioned for 14 days. Final invoice subject to institutional procurement approval.</small></div>}
          <div className="wizard-actions provision-actions"><button className="button button-outline" onClick={() => window.print()}><FileText size={15} /> {paymentMethod === "invoice" ? "Print / save invoice" : "Save setup details"}</button><button className="button button-primary" onClick={() => { onTenantReady?.(tenant); onClose(); }}>Open tenant preview <ArrowRight size={16} /></button></div>
        </div>}
        {error && <div className="wizard-error" role="alert">{error}</div>}
      </section>
    </div>
  );
}