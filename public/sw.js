/*
 * Service worker — håndskrevet, som alt annet her. Ingen byggeplugin.
 *
 * To strategier, og skillet mellom dem er hele poenget:
 *
 *  - Dokumentet (navigering) hentes fra NETTET FØRST. Vite stempler filnavnene
 *    med innholdshash, men index.html peker på dem — serverer vi en gammel
 *    index.html fra hurtiglageret, kjører spilleren gammel kode mot en nyere
 *    lagring, og migreringen avviser den med «fra en nyere spillversjon».
 *    Nettet først betyr at en ny utgivelse alltid når frem når du er på nett.
 *  - Alt annet fra samme opphav hentes fra HURTIGLAGERET FØRST. Det er trygt
 *    nettopp fordi navnene er hashet: endres innholdet, endres filnavnet.
 *
 * Offline: dokumentet faller tilbake på den sist lagrede index.html, og
 * ressursene den peker på ligger allerede i hurtiglageret fra sist besøk.
 */

const LAGER = 'milliardaer-v1'

// Hver utgivelse gir nye hashede filnavn, og de gamle blir liggende. Uten tak
// vokser hurtiglageret med én bunt per utgivelse i det uendelige. Nøklene
// kommer i innsettingsrekkefølge, så de eldste ligger først.
const MAKS_RESSURSER = 20

// Skallet vi kan navngi på forhånd. Ressursene med hash legges inn etter hvert
// som de hentes — vi kan ikke vite navnene deres her.
const SKALL = ['./', './index.html', './manifest.webmanifest', './ikon.svg', './apple-touch-icon.png', './ikon-192.png', './ikon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(LAGER)
      // Ett manglende ikon skal ikke velte hele installasjonen.
      .then((lager) => Promise.allSettled(SKALL.map((sti) => lager.add(sti))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((navn) => Promise.all(navn.filter((n) => n !== LAGER).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const forespørsel = e.request
  if (forespørsel.method !== 'GET') return
  const url = new URL(forespørsel.url)
  if (url.origin !== self.location.origin) return

  if (forespørsel.mode === 'navigate') {
    e.respondWith(
      fetch(forespørsel)
        .then((svar) => {
          const kopi = svar.clone()
          caches.open(LAGER).then((lager) => lager.put('./index.html', kopi))
          return svar
        })
        .catch(() => caches.match('./index.html').then((truffet) => truffet ?? Response.error())),
    )
    return
  }

  e.respondWith(
    caches.match(forespørsel).then((truffet) => {
      if (truffet) return truffet
      return fetch(forespørsel).then((svar) => {
        // Bare hele, vellykkede svar er verdt å lagre.
        if (svar.ok && svar.status === 200) {
          const kopi = svar.clone()
          caches.open(LAGER).then(async (lager) => {
            await lager.put(forespørsel, kopi)
            await beskjaerHurtiglager(lager)
          })
        }
        return svar
      })
    }),
  )
})

/** Kaster de eldste ressursene når taket er nådd. Skallet røres aldri. */
async function beskjaerHurtiglager(lager) {
  const nøkler = await lager.keys()
  const ressurser = nøkler.filter((n) => new URL(n.url).pathname.includes('/assets/'))
  for (const gammel of ressurser.slice(0, Math.max(0, ressurser.length - MAKS_RESSURSER))) {
    await lager.delete(gammel)
  }
}
