import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Infinity, Home, Globe, Database, Vault, Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { isAdmin, setAdmin } from "@/lib/admin";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/proxies", label: "More Proxies", icon: Globe },
  { to: "/dump", label: "Dump", icon: Database },
  { to: "/vault", label: "Vault", icon: Vault },
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

  // Hide chrome when on vault (it has its own UI)
  const isVault = location.pathname.startsWith("/vault");

  if (isVault) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 flex items-center justify-center vault-glow group-hover:vault-glow-hover transition-all">
              <Infinity size={22} className="text-primary" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-base font-bold text-gradient-gold leading-none">Infinite Unblocker</div>
              <div className="text-[10px] text-muted-foreground font-display tracking-widest">V4</div>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-xl p-1 backdrop-blur">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-display font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => {
              if (admin && confirm("Lock admin mode?")) setAdmin(false);
            }}
            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-display font-semibold border transition-all ${
              admin
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-secondary/40 border-border/40 text-muted-foreground"
            }`}
            title={admin ? "Click to lock" : "Locked"}
          >
            {admin ? <Unlock size={12} /> : <Lock size={12} />}
            <span className="hidden md:inline">{admin ? "Admin" : "Locked"}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
