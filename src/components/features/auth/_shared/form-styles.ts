// Gemeinsame Basisklassen für einfache Text-Inputs in den Auth-Formularen.
// Die Formulare unterscheiden sich nur in einer Text-Utility — daher die Basis
// hier zentral halten und pro Form ergänzen (z. B. `text-stone-800` im
// Buyer-LoginModal, `text-sm` in den Seller-Registrierungsfeldern).
export const textInputClass =
  "w-full rounded-xl border border-stone-300 px-3 py-2.5 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
