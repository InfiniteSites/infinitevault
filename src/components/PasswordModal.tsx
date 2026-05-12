import { useState } from "react";
import { Lock, X } from "lucide-react";
import { ADMIN_PASSWORD, setAdmin } from "@/lib/admin";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PasswordModal = ({ open, onClose, onSuccess }: Props) => {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.trim().toLowerCase() === ADMIN_PASSWORD.toLowerCase()) {
      setAdmin(true);
      setPw("");
      setErr(false);
      onSuccess?.();
      onClose();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className={`relative w-full max-w-sm bg-card border border-primary/30 rounded-2xl p-6 vault-glow ${err ? "animate-shake" : ""}`}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/40 flex items-center justify-center">
            <Lock size={18} className="text-primary" />
          </div>
          <div>
            <div className="font-display font-bold text-lg text-gradient-gold">Enter the password</div>
            <div className="text-xs text-muted-foreground">Restricted area</div>
          </div>
        </div>
        <form onSubmit={submit}>
          <input
            autoFocus
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={`w-full px-4 py-3 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
              err ? "border-destructive" : "border-border"
            }`}
            placeholder="Password"
          />
          <button
            type="submit"
            className="mt-3 w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-display font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
