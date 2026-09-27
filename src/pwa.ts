/**
 * Registrering av service worker — KUN i produksjonsbygget. Et hurtiglager
 * foran Vites utviklingsserver gir halvlastede moduler og forvirring.
 */
export function registrerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    // Offline er en bonus: feiler registreringen, kjører spillet som en vanlig nettside.
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
