import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";

interface PricingTiersProps {
  onSelectPlan: (plan: "pilot" | "full" | "enterprise") => void;
}

const plans = [
  {
    id: "pilot" as const,
    name: "Pilot / Department",
    description: "A focused start for one department or building.",
    aed: "1,500",
    usd: "410",
    cadence: "/ month",
    features: ["Up to 25 rooms", "One building floor plan", "Live schedule sync", "Your campus subdomain"],
    action: "Start a pilot",
  },
  {
    id: "full" as const,
    name: "Full Campus",
    description: "Everything your campus needs to stay in sync.",
    aed: "4,500",
    usd: "1,225",
    cadence: "/ month",
    features: ["Unlimited rooms & floor plans", "Student and faculty lookup", "CSV / API timetable sync", "Custom campus branding"],
    action: "Choose Full Campus",
    popular: true,
  },
  {
    id: "enterprise" as const,
    name: "Multi-Campus",
    description: "Connected operations for institutions at scale.",
    aed: "12,000+",
    usd: "3,270+",
    cadence: "/ month",
    features: ["Multiple campus branches", "SSO / Active Directory", "Dedicated service SLA", "Custom domain support"],
    action: "Talk to our team",
  },
];

export default function PricingTiers({ onSelectPlan }: PricingTiersProps) {
  const [currency, setCurrency] = useState<"AED" | "USD">("AED");
  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-heading pricing-heading">
          <span className="eyebrow">CLEAR PRICING. ROOM TO GROW.</span>
          <h2>Start with your campus.<br /><span className="text-gradient">Scale at your own pace.</span></h2>
          <p>Simple monthly plans designed around how universities actually operate.</p>
          <div className="currency-toggle" role="group" aria-label="Pricing currency">
            <button className={currency === "AED" ? "currency-active" : ""} onClick={() => setCurrency("AED")}>AED</button>
            <button className={currency === "USD" ? "currency-active" : ""} onClick={() => setCurrency("USD")}>USD</button>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={`price-card ${plan.popular ? "price-card-popular" : ""}`}>
              {plan.popular && <div className="popular-ribbon"><Sparkles size={13} /> MOST POPULAR</div>}
              <div className="price-card-top"><span className="plan-kicker">{plan.id === "pilot" ? "01 / BEGIN" : plan.id === "full" ? "02 / GROW" : "03 / SCALE"}</span><h3>{plan.name}</h3><p>{plan.description}</p></div>
              <div className="price-amount"><span>{currency}</span> {plan.id === "enterprise" ? (currency === "AED" ? plan.aed : plan.usd) : (currency === "AED" ? plan.aed : plan.usd)}<small>{plan.cadence}</small></div>
              <div className="price-divider" />
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
              <button className={`button ${plan.popular ? "button-primary" : "button-outline"} price-action`} onClick={() => onSelectPlan(plan.id)}>{plan.action}<ArrowRight size={16} /></button>
            </article>
          ))}
        </div>
        <p className="pricing-note">Need a tailored plan? <a href="mailto:hello@campusyncer.com">Let&apos;s talk about your campus <ArrowRight size={13} /></a></p>
      </div>
    </section>
  );
}