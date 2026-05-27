import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/domains/auth/AuthContext";
import { formatRoleLabel } from "@/domains/auth/labels";

export function NoCompanyAssignedPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center">
        <Building2 size={32} className="mx-auto text-stone-300 mb-4" />
        <h1 className="text-lg font-bold text-stone-900">No company assigned</h1>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">
          Your account is signed in as a company owner, but no company membership was
          found. Ask a platform administrator to add you to a company in AI Finance OS.
        </p>
        {profile && (
          <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-left">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
              Signed in as
            </p>
            <p className="text-xs font-semibold text-stone-800 mt-1">{profile.email}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              Role: {formatRoleLabel(profile.role)}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
