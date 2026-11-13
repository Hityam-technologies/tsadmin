/**
 * Shown while the app asks the server "is this person still signed in?"
 * The page stays put instead of flashing the login form.
 */
export function SessionGate() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] text-charcoal-700">
      <p className="text-sm font-semibold tracking-wide">Opening the atelier…</p>
    </div>
  );
}
