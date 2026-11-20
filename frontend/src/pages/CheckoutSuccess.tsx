import { ArrowRight, BadgeCheck, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { confirmDemoPayment, getCheckoutStatus, type ProvisioningResult, type Tenant } from "../lib/api";
import TenantPortalModal from "../components/TenantPortalModal";

export default function CheckoutSuccess() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [message, setMessage] = useState("Confirming your payment and provisioning your campus...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPortal, setShowPortal] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const requestId = query.get("request_id");
  const demo = query.get("demo") === "1";
  const sessionId = query.get("session_id");

  const setProvisionedTenant = (result: ProvisioningResult) => {
    setTenant({
      id: result.tenant_id,
      university_name: result.university_name,
      slug: result.slug,
      plan: result.plan,
      status: result.status,
      estimated_rooms: result.estimated_rooms,
      estimated_buildings: result.estimated_buildings,
      currency: result.currency,
      admin_setup_token: result.admin_setup_token,
      sandbox_expires_at: result.preview_expires_at,
    });
  };

  const checkPayment = async () => {
    setLoading(true);
    setError("");
    try {
      if (demo && requestId) {
        setProvisionedTenant(await confirmDemoPayment(requestId));
        setMessage("Demo payment confirmed. Your campus is live.");
      } else if (sessionId) {
        const status = await getCheckoutStatus(sessionId);
        if (status.paid) {
          setProvisionedTenant(status);
          setMessage("Payment confirmed. Your campus is live.");
        } else {
          setMessage("Checkout is complete. We are waiting for Stripe to confirm payment.");
        }
      } else {
        throw new Error("Missing checkout reference. Please return to the onboarding portal.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not verify payment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkPayment();
    // The checkout parameters are fixed for this page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="checkout-page">
      <a className="brand checkout-brand" href="/"><span className="brand-mark">C<span>.</span></span><span className="brand-copy"><strong>campusync</strong><small>by Vortex Group</small></span></a>
      <section className="checkout-card">
        {loading ? <span className="checkout-icon"><LoaderCircle className="spin" size={27} /></span> : error ? <span className="checkout-icon checkout-error"><CircleAlert size={27} /></span> : tenant ? <span className="checkout-icon checkout-success"><BadgeCheck size={29} /></span> : <span className="checkout-icon"><ShieldCheck size={27} /></span>}
        <span className="eyebrow">{tenant ? "CAMPUS PROVISIONED" : error ? "ACTION NEEDED" : "SECURE CHECKOUT"}</span>
        <h1>{tenant ? "You’re in sync." : error ? "We couldn’t verify that yet." : "Finalizing your campus."}</h1>
        <p>{error || message}</p>
        {tenant && <div className="checkout-tenant"><strong>{tenant.university_name}</strong><span>https://{tenant.slug}.campusync.net</span><small><ShieldCheck size={14} /> Setup token: <code>{tenant.admin_setup_token}</code></small></div>}
        {tenant ? <div className="checkout-actions"><button className="button button-primary" onClick={() => setShowPortal(true)}>Preview your campus <ArrowRight size={16} /></button><a href="/" className="button button-quiet">Back to CampuSync</a></div> : <div className="checkout-actions"><button className="button button-primary" disabled={loading} onClick={() => void checkPayment()}>{loading ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />} {error ? "Try again" : "Check payment status"}</button><a href="/" className="button button-quiet">Return to CampuSync</a></div>}
      </section>
      {tenant && <TenantPortalModal tenant={showPortal ? tenant : null} onClose={() => setShowPortal(false)} />}
    </main>
  );
}