import { ArrowUpRight, Check, Clock3, MapPin, ShieldCheck, Users, X } from "lucide-react";
import type { Tenant } from "../lib/api";

interface TenantPortalModalProps {
  tenant: Tenant | null;
  onClose: () => void;
}

export default function TenantPortalModal({ tenant, onClose }: TenantPortalModalProps) {
  if (!tenant) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="tenant-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close preview"><X size={19} /></button>
        <div className="tenant-modal-header"><span className="mini-mark">C</span><span>YOUR CAMPUS PORTAL</span></div>
        <div className="tenant-hero"><span className="tenant-status"><span className="live-dot" />{tenant.status.replace(/_/g, " ")}</span><h2 id="tenant-title">{tenant.university_name}</h2><p>{tenant.slug}.campusyncer.com</p></div>
        <div className="tenant-metrics"><div><MapPin size={17} /><strong>{tenant.estimated_buildings}</strong><span>Buildings</span></div><div><Users size={17} /><strong>{tenant.estimated_rooms}</strong><span>Rooms tracked</span></div><div><Clock3 size={17} /><strong>Live</strong><span>Schedule sync</span></div></div>
        <div className="portal-room"><div><span className="live-dot" /><strong>Innovation Studio</strong><small>Available now · 24 seats</small></div><span className="portal-open"><Check size={15} /> OPEN</span></div>
        <div className="setup-token"><ShieldCheck size={17} /><div><span>ADMIN SETUP TOKEN</span><code>{tenant.admin_setup_token}</code></div><button className="icon-button" onClick={() => navigator.clipboard.writeText(tenant.admin_setup_token)} aria-label="Copy setup token"><ArrowUpRight size={15} /></button></div>
        <button className="button button-primary tenant-done" onClick={onClose}>Close campus preview</button>
      </section>
    </div>
  );
}