export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto rounded-full border-2 border-green-800 border-t-transparent animate-spin" />
        <p className="text-xs text-stone-500 mt-3">Loading session…</p>
      </div>
    </div>
  );
}
