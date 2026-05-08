import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { PinViewLogo } from "@/components/logo";

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
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
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
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMeQueryKey(), data.user);
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
    <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center dark px-4">
      {/* Card — matches pin-view-manager sign-in card */}
      <div
        className="w-full max-w-[360px] rounded-2xl p-8"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <PinViewLogo size="md" />
          <p className="mt-3 text-white/90 font-bold text-lg">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </p>
          <p className="text-white/35 text-sm mt-0.5">
            {tab === "login" ? "Sign in to your PinView account" : "Start sharing your golf shots"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          className="flex rounded-lg p-0.5 mb-6"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <button
            data-testid="tab-login"
            onClick={() => { setTab("login"); setError(null); }}
            className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
            style={tab === "login" ? { background: "#22c55e", color: "#0a0a0a" } : { color: "rgba(255,255,255,0.4)" }}
          >
            Sign In
          </button>
          <button
            data-testid="tab-register"
            onClick={() => { setTab("register"); setError(null); }}
            className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
            style={tab === "register" ? { background: "#22c55e", color: "#0a0a0a" } : { color: "rgba(255,255,255,0.4)" }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Email address
              </label>
              <input
                data-testid="input-email"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={e => (e.target.style.borderColor = "#22c55e")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Password
              </label>
              <input
                data-testid="input-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={e => (e.target.style.borderColor = "#22c55e")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <button
              data-testid="button-submit-login"
              type="submit"
              disabled={login.isPending}
              className="btn-brand w-full py-2.5 rounded-lg text-sm font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {login.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>Continue <span className="text-black/60">▶</span></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Username
                </label>
                <input
                  data-testid="input-username"
                  placeholder="golfer42"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "#22c55e")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Display Name
                </label>
                <input
                  data-testid="input-display-name"
                  placeholder="Tiger W."
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "#22c55e")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Email address
              </label>
              <input
                data-testid="input-email-register"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.target.style.borderColor = "#22c55e")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Password
              </label>
              <input
                data-testid="input-password-register"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.target.style.borderColor = "#22c55e")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Handicap <span style={{ color: "rgba(255,255,255,0.25)" }}>(optional)</span>
              </label>
              <input
                data-testid="input-handicap"
                type="number"
                step="0.1"
                placeholder="12.4"
                value={form.handicap}
                onChange={e => setForm(f => ({ ...f, handicap: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.target.style.borderColor = "#22c55e")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <button
              data-testid="button-submit-register"
              type="submit"
              disabled={register.isPending}
              className="btn-brand w-full py-2.5 rounded-lg text-sm font-bold mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {register.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>Create Account <span className="text-black/60">▶</span></>
              )}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          EVERY SHOT. CAPTURED.
        </p>
      </div>
    </div>
  );
}
