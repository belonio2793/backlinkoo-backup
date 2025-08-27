export type CheckoutIntent = 
  | { type: 'credits'; credits: number; price: number }
  | { type: 'premium'; plan: 'monthly' | 'yearly' };

const STORAGE_KEY = 'checkout_intent';

export function setCheckoutIntent(intent: CheckoutIntent) {
  try {
    const payload = {
      ...intent,
      ts: Date.now(),
      path: typeof window !== 'undefined' ? window.location.pathname : '/' 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export function getCheckoutIntent(): (CheckoutIntent & { ts?: number; path?: string }) | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCheckoutIntent() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
