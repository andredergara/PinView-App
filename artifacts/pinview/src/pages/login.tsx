import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "", handicap: "" });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const login = useLogin();
  const register = useRegister();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    login.mutate(
      { data: { email: form.email, password: form.password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/");
        },
        onError: () => setError("Invalid credentials. Please try again."),
      }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    register.mutate(
      {
        data: {
          email: form.email,
          password: form.password,
          username: form.username,
          displayName: form.displayName,
          handicap: form.handicap ? parseFloat(form.handicap) : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/");
        },
        onError: (err: unknown) => {
          const msg = (err as { message?: string })?.message ?? "Registration failed";
          setError(msg);
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black flex justify-center dark">
      <div className="w-full max-w-[430px] min-h-[100dvh] relative flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round" />
                <path d="M5.636 5.636l1.414 1.414M16.95 16.95l1.414 1.414M5.636 18.364l1.414-1.414M16.95 7.05l1.414-1.414" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">PinView</h1>
            <p className="text-lg font-semibold text-primary tracking-wide mb-1">Every Shot. Captured.</p>
            <p className="text-sm text-white/50">Share your golf game with the world.</p>
          </div>

          {/* Tab Toggle */}
          <div className="w-full flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
            <button
              data-testid="tab-login"
              onClick={() => { setTab("login"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === "login" ? "bg-primary text-black" : "text-white/50 hover:text-white"}`}
            >
              Sign In
            </button>
            <button
              data-testid="tab-register"
              onClick={() => { setTab("register"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === "register" ? "bg-primary text-black" : "text-white/50 hover:text-white"}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="w-full mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
                <Input
                  data-testid="input-email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
                <Input
                  data-testid="input-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                />
              </div>
              <Button
                data-testid="button-submit-login"
                type="submit"
                disabled={login.isPending}
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-black mt-2"
              >
                {login.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Username</label>
                  <Input
                    data-testid="input-username"
                    placeholder="golfer42"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Display Name</label>
                  <Input
                    data-testid="input-display-name"
                    placeholder="Tiger W."
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
                <Input
                  data-testid="input-email-register"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
                <Input
                  data-testid="input-password-register"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Handicap (optional)</label>
                <Input
                  data-testid="input-handicap"
                  type="number"
                  step="0.1"
                  placeholder="12.4"
                  value={form.handicap}
                  onChange={e => setForm(f => ({ ...f, handicap: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                />
              </div>
              <Button
                data-testid="button-submit-register"
                type="submit"
                disabled={register.isPending}
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-black mt-2"
              >
                {register.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}
        </div>

        <div className="pb-8 text-center">
          <p className="text-white/20 text-xs">Built for golfers. By golfers.</p>
        </div>
      </div>
    </div>
  );
}
