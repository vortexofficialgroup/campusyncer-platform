import { useEffect, useState } from "react";
import OnboardingWizard from "./components/OnboardingWizard";
import TenantPortalModal from "./components/TenantPortalModal";
import AdminPortal from "./pages/AdminPortal";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import LandingPage from "./pages/LandingPage";
import type { Plan, Tenant } from "./lib/api";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = window.localStorage.getItem("campusync-theme");
    return stored === "light" ? "light" : "dark";
  });
  const [wizardOpen, setWizardOpen] = useState(false);
  const [initialPlan, setInitialPlan] = useState<Plan | undefined>();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("campusync-theme", theme);
  }, [theme]);

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin") return <AdminPortal />;
  if (path === "/checkout-success") return <CheckoutSuccess />;

  const launch = (plan?: Plan) => {
    setInitialPlan(plan);
    setWizardOpen(true);
  };
  return (
    <>
      <LandingPage onLaunch={launch} theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
      <OnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} initialPlan={initialPlan} onTenantReady={setTenant} />
      <TenantPortalModal tenant={tenant && !wizardOpen ? tenant : null} onClose={() => setTenant(null)} />
    </>
  );
}