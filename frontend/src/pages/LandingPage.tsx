import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, CirclePlay, Command, Layers3, Zap } from "lucide-react";
import InteractivePreview from "../components/InteractivePreview";
import Navbar from "../components/Navbar";
import PricingTiers from "../components/PricingTiers";
import type { Plan } from "../lib/api";

interface LandingPageProps {
  onLaunch: (plan?: Plan) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const benefits = [
  { icon: Layers3, title: "Spatial, not spreadsheets", copy: "Know what is happening across every building and floor at a glance." },
  { icon: Zap, title: "Schedules stay in sync", copy: "Bring timetables and room availability together in one live view." },
  { icon: Command, title: "A portal that is yours", copy: "Your university gets a branded, private campus experience." },
];

export default function LandingPage({ onLaunch, theme, onToggleTheme }: LandingPageProps) {
  return (
    <>
      <Navbar onLaunch={() => onLaunch()} theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <section className="hero-section">
          <div className="hero-grid-pattern" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow"><span className="live-dot" /> CAMPUS OPERATIONS, REIMAGINED</span>
              <h1>Real-Time Campus Visibility.<br /><span className="text-gradient">Deployed in Minutes.</span></h1>
              <p>Live room availability, interactive floor plans, and automated schedule lookups for modern universities—starting in Dubai, built for campuses worldwide.</p>
              <div className="hero-actions"><button className="button button-primary button-large" onClick={() => onLaunch()}>Launch your campus portal <ArrowRight size={17} /></button><a className="button button-quiet button-large" href="#preview"><CirclePlay size={17} /> Explore UE Dubai demo</a></div>
              <div className="hero-trust"><div className="avatar-stack"><span>U</span><span>V</span><span>+</span></div><div><strong>Built for campus teams</strong><small>By Vortex Group · Dubai, UAE</small></div><span className="trust-divider" /><span className="trust-check"><Check size={13} /> Ready to deploy</span></div>
            </div>
            <div className="hero-visual">
              <div className="visual-glow" />
              <div className="hero-dashboard">
                <div className="dashboard-top"><span className="mini-mark">U</span><div><strong>UE Dubai</strong><small>Innovation Wing · Ground floor</small></div><span className="dashboard-live"><i /> LIVE</span></div>
                <div className="dashboard-stats"><div><small>ROOMS AVAILABLE</small><strong>12<span>/ 28</span></strong><div className="stat-bar"><i /></div></div><div><small>IN SESSION</small><strong>09</strong><span className="stat-note">Across 4 buildings</span></div></div>
                <div className="dashboard-map-label"><span>FLOOR PLAN</span><span>UPDATED JUST NOW</span></div>
                <div className="mini-floor"><i className="mini-room available" /><i className="mini-room session" /><i className="mini-room available wide" /><i className="mini-room booked" /><i className="mini-room session wide" /><i className="mini-room available" /><i className="mini-room booked wide" /><i className="mini-room available" /><i className="mini-room available wide" /><i className="mini-corridor" /></div>
                <div className="dashboard-foot"><span><i className="legend-dot green" /> Available</span><span><i className="legend-dot cyan" /> In session</span><span><i className="legend-dot muted" /> Booked</span></div>
              </div>
              <div className="floating-notification"><span className="notification-icon"><Zap size={14} /></span><div><strong>Room status synced</strong><small>Studio 01 is now available</small></div><span className="notification-time">now</span></div>
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            </div>
          </div>
          <div className="hero-bottom container"><span>ONE CAMPUS. ONE CLEAR PICTURE.</span><a href="#how-it-works">See how it works <ArrowDown size={14} /></a></div>
        </section>
        <section className="benefit-strip" id="how-it-works">
          <div className="container benefit-grid">{benefits.map(({ icon: Icon, title, copy }, index) => <article className="benefit-card" key={title}><span className="benefit-number">0{index + 1}</span><span className="benefit-icon"><Icon size={20} /></span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </section>
        <InteractivePreview />
        <section className="workflow-section">
          <div className="container workflow-layout">
            <div className="workflow-intro"><span className="eyebrow">A SHORTER PATH TO LIVE</span><h2>From first hello<br />to <span className="text-gradient">campus-wide clarity.</span></h2><p>No months-long rollout. Configure your space, connect your schedules, and bring your campus online at your pace.</p><button className="button button-outline" onClick={() => onLaunch()}>See how onboarding works <ArrowUpRight size={16} /></button></div>
            <div className="workflow-steps"><div className="workflow-line" /><article><span>01</span><div><h3>Claim your campus URL</h3><p>Choose your university subdomain and workspace details.</p></div><ChevronRight size={17} /></article><article><span>02</span><div><h3>Map your spaces</h3><p>Select the right plan and tell us about your campus scale.</p></div><ChevronRight size={17} /></article><article><span>03</span><div><h3>Go live on your terms</h3><p>Activate by card or start with an institutional invoice.</p></div><ChevronRight size={17} /></article></div>
          </div>
        </section>
        <PricingTiers onSelectPlan={(plan) => onLaunch(plan)} />
        <section className="closing-cta"><div className="container closing-inner"><div><span className="eyebrow">YOUR CAMPUS, IN SYNC</span><h2>Make room for what&apos;s next.</h2><p>Bring your campus operations into focus with CampuSync.</p></div><button className="button button-primary button-large" onClick={() => onLaunch()}>Deploy your campus <ArrowRight size={17} /></button></div></section>
      </main>
      <footer className="site-footer"><div className="container footer-inner"><a className="brand" href="#"><span className="brand-mark">C<span>.</span></span><span className="brand-copy"><strong>campusync</strong><small>by Vortex Group</small></span></a><span>Campus operations, in sync.</span><div><a href="#pricing">Pricing</a><a href="mailto:hello@campusync.net">Contact</a><a href="/admin">Admin</a></div><small>© {new Date().getFullYear()} Vortex Group. Dubai, UAE.</small></div></footer>
    </>
  );
}