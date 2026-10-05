import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Feilgrense } from './ui/komponenter/Avbrudd'
import { Galleri } from './ui/screens/Galleri'
import { registrerServiceWorker } from './pwa'
import { brukTema, lesTema } from './ui/tema'
import { brukBevegelse } from './ui/innstillinger'
import './styles.css'

// Temaet settes før første tegning, så et lyst valg ikke blinker mørkt først.
brukTema(lesTema())
brukBevegelse()

// ?galleri viser illustrasjonene store, uten å starte spillet.
const galleri = new URLSearchParams(location.search).has('galleri')

createRoot(document.getElementById('root')!).render(<StrictMode>{galleri ? <Galleri /> : <Feilgrense><App /></Feilgrense>}</StrictMode>)

registrerServiceWorker()
