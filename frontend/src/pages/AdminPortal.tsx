import { ArrowLeft, ArrowUpRight, BadgeCheck, Building2, CircleDollarSign, FileText, KeyRound, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { activateInvoiceRequest, getAdminRequests, type AdminRequest } from "../lib/api";

export default function AdminPortal() {
  const [pin, setPin] = useState("");
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadRequests = async (secret = pin) => {
    setBusy(true);
    setError("");
    try {
      setRequests(await getAdminRequests(secret));
      setAuthenticated(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load requests.");
      setAuthenticated(false);
    } finally {
      setBusy(false);
    }
  };
  const activate = async (item: AdminRequest) => {
    setBusy(true);
    setError("");
    try {
      await activateInvoiceRequest(item.id, pin);
      await loadRequests(pin);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not activate this tenant.");
      setBusy(false);
    }
  };

  return (
    <main className="admin-page">
      <header className="admin-topbar"><a className="brand" href="/"><span className="brand-mark">C<span>.</span></span><span className="brand-copy"><strong>campusync</strong><small>Vortex command</small></span></a><a href="/" className="button button-quiet"><ArrowLeft size={15} /> Back to website</a></header>
      {!authenticated ? <section className="admin-login-card"><span className="admin-lock"><KeyRound size={22} /></span><span className="eyebrow">VORTEX GROUP · INTERNAL</span><h1>Command center.</h1><p>Sign in with your admin PIN to review campus requests and manage tenant activation.</p><form onSubmit={(event) => { event.preventDefault(); void loadRequests(); }}><label className="field-label">Admin PIN<input autoFocus type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Enter your admin PIN" required /></label><button className="button button-primary button-full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />} Secure sign in</button></form>{error && <div className="wizard-error">{error}</div>}<small className="login-footnote">Authorized Vortex Group personnel only.</small></section> : <section className="admin-content container"><div className="admin-heading"><div><span className="eyebrow"><span className="live-dot" /> VORTEX GROUP · COMMAND CENTER</span><h1>Campus requests.</h1><p>Review onboarding, procurement and live tenant status.</p></div><button className="button button-outline" onClick={() => void loadRequests()} disabled={busy}><RefreshCw className={busy ? "spin" : ""} size={15} /> Refresh</button></div><div className="admin-stats"><div><span><Building2 size={17} /></span><small>TOTAL REQUESTS</small><strong>{requests.length}</strong></div><div><span><CircleDollarSign size={17} /></span><small>INVOICE / PO</small><strong>{requests.filter((request) => request.payment_method === "invoice").length}</strong></div><div><span><BadgeCheck size={17} /></span><small>ACTIVE CAMPUSES</small><strong>{requests.filter((request) => request.tenant.status === "ACTIVE").length}</strong></div></div>{error && <div className="wizard-error">{error}</div>}{requests.length === 0 ? <div className="admin-empty"><Building2 size={24} /><h2>No campus requests yet</h2><p>Requests created through the onboarding portal will appear here.</p></div> : <div className="request-table-wrap"><table className="request-table"><thead><tr><th>INSTITUTION</th><th>CONTACT</th><th>PAYMENT</th><th>TENANT STATUS</th><th>ACTION</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id}><td><strong>{item.tenant.university_name}</strong><small>{item.tenant.slug}.campusync.net</small></td><td>{item.contact_name}<small>{item.email}</small></td><td><span className="payment-type"><FileText size={13} /> {item.payment_method === "invoice" ? "Invoice / PO" : "Card"}</span><small>{item.invoice_reference || item.payment_status}</small></td><td><span className={`status-pill ${item.tenant.status === "ACTIVE" ? "status-active" : "status-sandbox"}`}>{item.tenant.status.replace(/_/g, " ")}</span></td><td>{item.payment_method === "invoice" && item.tenant.status !== "ACTIVE" ? <button className="button button-primary button-small" disabled={busy} onClick={() => void activate(item)}><BadgeCheck size={14} /> Approve & activate</button> : <a className="table-link" href={`https://${item.tenant.slug}.campusync.net`} target="_blank" rel="noreferrer">Inspect <ArrowUpRight size={14} /></a>}</td></tr>)}</tbody></table></div>}<button className="button button-quiet admin-signout" onClick={() => { setAuthenticated(false); setPin(""); setRequests([]); }}>Sign out</button></section>}
    </main>
  );
}