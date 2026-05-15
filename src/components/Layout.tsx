import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Infinity, Home, Globe, Database, Vault, ShieldCheck, Shuffle, Dice5, Settings, ListChecks, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { isAdmin, setAdmin } from "@/lib/admin";
import { api } from "@/lib/api";
import SpaceBackground from "@/components/SpaceBackground";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/chooser", label: "Chooser", icon: ListChecks },
  { to: "/proxies", label: "More Proxies", icon: Globe },
  { to: "/dump", label: "Dump", icon: Database },
  { to: "/generator", label: "Generator", icon: Shuffle },
  { to: "/gambling", label: "Gambling", icon: Dice5 },
  { to: "/vault", label: "Vault", icon: Vault },
  { to: "/chat", label: "AI", icon: Sparkles },
  { to: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

const Layout = () => {
  const [admin, setAdminState] = useState(isAdmin());
  const location = useLocation();

  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("admin-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  // Bump site visits once per session
  useEffect(() => {
    if (sessionStorage.getItem("iv_visited")) return;
    sessionStorage.setItem("iv_visited", "1");
    api.bumpSite().catch(() => {});
  }, []);

  // Trigger a link-status recheck every 20 minutes (and once on first load per tab)
  useEffect(() => {
    const KEY = "iv_last_recheck";
    const TWENTY_MIN = 20 * 60 * 1000;
    const tick = () => {
      const last = +(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last > TWENTY_MIN) {
        localStorage.setItem(KEY, String(Date.now()));
        api.checkAll().catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen relative">
      <SpaceBackground />

      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/40 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40 flex items-center justify-center vault-glow group-hover:vault-glow-hover transition-all">
              <Infinity size={22} className="text-primary" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-base font-black text-gradient-cosmic leading-none tracking-wider">INFINITE UNBLOCKER</div>
              <div className="text-[10px] text-accent font-display tracking-[0.4em] mt-0.5">V4</div>
            </div>
          </NavLink>

          <nav className="flex items-center gap-0.5 bg-secondary/30 border border-border/40 rounded-xl p-1 backdrop-blur overflow-x-auto">
            {navItems.filter((n) => !n.adminOnly || admin).map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 lg:px-3.5 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`
                }
              >
                <Icon size={13} />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {admin ? (
            <button
              onClick={() => { if (confirm("Lock admin mode?")) setAdmin(false); }}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-display font-bold border bg-primary/15 border-primary/50 text-primary hover:bg-primary/25 transition"
              title="Click to lock"
            >
              <ShieldCheck size={12} />
              <span className="hidden md:inline">ADMIN</span>
            </button>
          ) : <div className="w-2" />}
        </div>
      </header>

      <main key={location.pathname} className="relative z-10 animate-page-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
