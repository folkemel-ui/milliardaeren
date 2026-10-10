import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Feilgrense } from './ui/komponenter/Avbrudd'
import { registrerServiceWorker } from './pwa'
import { brukTema, lesTema } from './ui/tema'
import { brukBevegelse } from './ui/innstillinger'
import { forvarm, lastAlle } from './ui/vedBehov'
import './styles/index.css'

// Temaet settes før første tegning, så et lyst valg ikke blinker mørkt først.
brukTema(lesTema())
brukBevegelse()

const rot = createRoot(document.getElementById('root')!)

// ?galleri viser illustrasjonene store, uten å starte spillet. Galleriet er ikke med
// i startskriptet, og det venter til alle tegningene og kartene er hentet (G12).
if (new URLSearchParams(location.search).has('galleri')) {
  Promise.all([import('./ui/screens/Galleri'), lastAlle()]).then(([{ Galleri }]) => rot.render(<StrictMode><Galleri /></StrictMode>))
} else {
  rot.render(<StrictMode><Feilgrense><App /></Feilgrense></StrictMode>)
  // Resten (eiendom, luksus, kartene) hentes i ro, så fanebytter ikke venter og alt er lagret uten nett.
  forvarm()
}

registrerServiceWorker()
