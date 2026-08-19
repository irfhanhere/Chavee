// Small, short-lived flags for features that are code-complete but not
// currently reachable, per explicit business decisions — not a general
// feature-flag framework, just a couple of named constants to gate the
// specific spots that need it.

// Cashfree vendor onboarding (cashfree-create-vendor) is real, deployed,
// and has full local source (supabase/functions/cashfree-create-vendor/)
// — it was never deleted. It's unreachable today purely because this flag
// is false, gating both call sites below; nothing else stands in the way.
// PayoutSetupForm.jsx still calls it. Locked business decision: payouts
// stay manual bank/UPI transfer until Chavee Technologies LLP registers
// (~early October). Gates both places that would otherwise show the
// PayoutSetupForm — Messages.jsx's automatic "Complete Payout Setup" modal,
// and Settings → Payout Setup. PayoutSetupForm.jsx itself is untouched and
// still exported normally — it's expected to be reused once the real manual
// withdrawal flow is built, at which point this flag (and the coming-soon
// message it gates) should just be deleted, not flipped back to fronting
// cashfree-create-vendor again.
export const PAYOUTS_LIVE = false;
