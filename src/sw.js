/*
 * Service worker — håndskrevet, som alt annet her. Ingen byggeplugin utenfra: den lille
 * `serviceWorker()` i vite.config.ts skriver lista over utgivelsens filer inn her og legger
 * fila i bygget som `sw.js`. Utviklingsserveren bruker den ikke (src/pwa.ts).
 *
 * Pakke 96 — en første start som virker uten nett:
 *
 *  - Ved installasjon lagres HELE utgivelsen: startskriptet, stilarket, skriften og alle
 *    delene som lastes ved behov (RESSURSER), og index.html. Før ble bare skallet lagret,
 *    og resten først ved andre besøk på nett — uten nett etter første besøk pustet mynten
 *    for alltid. Mangler én fil, feiler installasjonen, og nettleseren prøver igjen senere:
 *    en halv utgivelse blir aldri det spillet faller tilbake på.
 *  - Hurtiglageret holder denne utgivelsen og den forrige, ikke noe mer. Den forrige blir
 *    liggende så en fane som sto åpen over en oppdatering, fortsatt finner delene sine.
 *    (Før: de 40 nyeste filene, og skriften og kartbitene ble kastet mens de var i bruk.)
 *
 * Strategiene:
 *
 *  - Dokumentet (navigering) hentes fra NETTET FØRST, men venter høyst 3 s før den lagrede
 *    index.html brukes (svarer nettet senere, lagres svaret til neste gang). Vite stempler
 *    filnavnene med innholdshash, men index.html peker på dem — en gammel index.html ville
 *    kjørt gammel kode mot en nyere lagring. Med god dekning når en ny utgivelse alltid frem.
 *  - Ressursene med hash (assets/) hentes fra HURTIGLAGERET FØRST. Det er trygt nettopp
 *    fordi navnene er hashet: endres innholdet, endres filnavnet.
 *  - Skallet uten hash (manifest og ikoner) vises fra hurtiglageret, men hentes samtidig
 *    på nytt i bakgrunnen, så en endring når frem neste gang.
 *  - En forespørsel med søkestreng (`index.html?utgave=…` fra ui/vedBehov.ts) går rett til
 *    nettet og lagres aldri: hver av dem ville ellers blitt liggende for alltid.
 *
 * Bare vellykkede svar lagres. En feilside fra serveren skal aldri bli det spillet faller
 * tilbake på uten nett.
 */

// Ett lager for alle utgivelser; hvilke filer som hører til hvilken, står i UTGAVER.
// v4: hele utgivelsen ved installasjon (Pakke 96).
const LAGER = 'milliardaer-v4'

// Skrives inn av vite.config.ts ved bygging. Utgaven er en hash av fillista, så fila endres
// med hver utgivelse, og nettleseren installerer den nye service workeren.
const UTGAVE = '__UTGAVE__'
const RESSURSER = /*RESSURSER*/ []

/** Hvor lenge en navigering venter på nettet før den lagrede index.html brukes. */
const NETT_VENTER_MS = 3000

/**
 * Oppslag ser bort fra Vary. Svarene kan ha `Vary: Origin`, og et modulskript eller en
 * forhåndslastet skrift sender Origin, mens forespørselen som lagret fila ved installasjon
 * ikke gjorde det — da fant oppslaget ingenting, og spillet startet ikke uten nett. Filene
 * med hash endres aldri, og index.html er den samme for alle.
 */
const UTEN_VARY = { ignoreVary: true }

/** Nøkkelen der lageret husker filene til denne og forrige utgivelse. */
const UTGAVER = './__utgaver.json'

// Skallet uten hash. index.html hentes for seg, forbi nettleserens egen hurtigbuffer.
const SKALL = ['./manifest.webmanifest', './ikon.svg', './apple-touch-icon.png', './ikon-192.png', './ikon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const lager = await caches.open(LAGER)
      // Filene som ikke ligger der fra før (skriften har samme navn i mange utgivelser).
      const mangler = []
      for (const sti of RESSURSER) if (!(await lager.match(sti, UTEN_VARY))) mangler.push(sti)
      await lager.addAll(mangler)
      await lager.add(new Request('./index.html', { cache: 'reload' }))
      // Ett manglende ikon skal ikke velte hele installasjonen.
      await Promise.allSettled(SKALL.map((sti) => lager.add(sti)))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const navn = await caches.keys()
      await Promise.all(navn.filter((n) => n !== LAGER).map((n) => caches.delete(n)))
      const lager = await caches.open(LAGER)
      const før = await lager.match(UTGAVER).then((s) => (s ? s.json() : null)).catch(() => null)
      const forrige = før && før.utgave !== UTGAVE ? før.filer : (før?.forrige ?? [])
      const behold = new Set([...RESSURSER, ...forrige].map((sti) => new URL(sti, self.location.href).href))
      for (const nøkkel of await lager.keys()) {
        if (new URL(nøkkel.url).pathname.includes('/assets/') && !behold.has(nøkkel.url)) await lager.delete(nøkkel)
      }
      const minne = JSON.stringify({ utgave: UTGAVE, filer: RESSURSER, forrige })
      await lager.put(UTGAVER, new Response(minne, { headers: { 'Content-Type': 'application/json' } }))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (e) => {
  const forespørsel = e.request
  if (forespørsel.method !== 'GET') return
  const url = new URL(forespørsel.url)
  if (url.origin !== self.location.origin) return

  if (forespørsel.mode === 'navigate') {
    let lagring = Promise.resolve()
    const nett = fetch(forespørsel).then((svar) => {
      if (svar.ok) {
        const kopi = svar.clone()
        lagring = caches.open(LAGER).then((lager) => lager.put('./index.html', kopi))
      }
      return svar
    })
    // Kom svaret etter de 3 sekundene, lagres det likevel til neste start.
    e.waitUntil(nett.then(() => lagring, () => {}))
    e.respondWith(nettEllerLager(nett))
    return
  }

  // Engangsspørsmål (en ny utgivelse?) skal til nettet, og aldri ligge igjen i lageret.
  if (url.search) return

  if (!url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(forespørsel, UTEN_VARY).then((truffet) => {
        const nytt = fetch(forespørsel)
          .then((svar) => {
            if (svar.ok && svar.status === 200) {
              const kopi = svar.clone()
              caches.open(LAGER).then((lager) => lager.put(forespørsel, kopi))
            }
            return svar
          })
          .catch(() => truffet ?? Response.error())
        if (truffet) {
          // Svar med en gang; oppdateringen fullføres i bakgrunnen.
          e.waitUntil(nytt.then(() => {}))
          return truffet
        }
        return nytt
      }),
    )
    return
  }

  e.respondWith(
    caches.match(forespørsel, UTEN_VARY).then((truffet) => {
      if (truffet) return truffet
      return fetch(forespørsel).then((svar) => {
        // Bare hele, vellykkede svar er verdt å lagre. Det som ikke hører til denne eller
        // forrige utgivelse, ryddes når neste service worker tar over.
        if (svar.ok && svar.status === 200) {
          const kopi = svar.clone()
          e.waitUntil(caches.open(LAGER).then((lager) => lager.put(forespørsel, kopi)))
        }
        return svar
      })
    }),
  )
})

/**
 * Svaret fra nettet hvis det kommer innen NETT_VENTER_MS, ellers den lagrede index.html.
 * Feiler nettet, brukes den lagrede med en gang. Finnes ingen lagret, ventes det på nettet.
 */
function nettEllerLager(nett) {
  return new Promise((svar) => {
    let ferdig = false
    const bruk = (r) => {
      if (ferdig || !r) return false
      ferdig = true
      svar(r)
      return true
    }
    const lagret = () => caches.match('./index.html', UTEN_VARY)
    const klokke = setTimeout(() => lagret().then(bruk), NETT_VENTER_MS)
    nett.then(
      (r) => {
        clearTimeout(klokke)
        bruk(r)
      },
      () => {
        clearTimeout(klokke)
        lagret().then((r) => bruk(r ?? Response.error()))
      },
    )
  })
}
