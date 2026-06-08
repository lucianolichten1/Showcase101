import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useAuth, getPostLoginPath } from "@/domains/auth/AuthContext";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { user, profile, memberships, loading, authError, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!loading && user && profile && !authError) {
    return <Navigate to={getPostLoginPath(profile, memberships)} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) setFormError(error);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-800 text-white mb-3">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-stone-900">AI Finance OS</h1>
          <p className="text-xs text-stone-500 mt-1 text-center">
            Sign in to manage your company finances.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4"
        >
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700"
              placeholder="••••••••"
            />
          </div>

          {(formError || authError) && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError ?? authError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className={cn(
              "w-full rounded-lg bg-green-800 px-3 py-2.5 text-xs font-semibold text-white transition-colors",
              submitting || loading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-900"
            )}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-[10px] text-stone-400 text-center mt-4 leading-relaxed">
          Platform auth only. Financial data remains local mock until company databases are
          connected.
        </p>
      </div>
    </div>
  );
}
