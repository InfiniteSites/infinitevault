import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Infinity, Home, Globe, Database, Vault, Lock, Unlock, Shuffle, Dice5 } from "lucide-react";
import { useEffect, useState } from "react";
import { isAdmin, setAdmin } from "@/lib/admin";
import SpaceBackground from "@/components/SpaceBackground";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/proxies", label: "More Proxies", icon: Globe },
  { to: "/dump", label: "Dump", icon: Database },
  { to: "/generator", label: "Generator", icon: Shuffle },
  { to: "/gambling", label: "Gambling", icon: Dice5 },
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

  const isVault = location.pathname.startsWith("/vault");
  if (isVault) return <Outlet />;

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
            {navItems.map(({ to, label, icon: Icon, end }) => (
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

          <button
            onClick={() => {
              if (admin && confirm("Lock admin mode?")) setAdmin(false);
            }}
            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-display font-bold border transition-all ${
              admin
                ? "bg-primary/15 border-primary/50 text-primary"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
            title={admin ? "Click to lock" : "Locked"}
          >
            {admin ? <Unlock size={12} /> : <Lock size={12} />}
            <span className="hidden md:inline">{admin ? "ADMIN" : "LOCKED"}</span>
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
