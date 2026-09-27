import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Galleri } from './ui/screens/Galleri'
import { registrerServiceWorker } from './pwa'
import { brukTema, lesTema } from './ui/tema'
import './styles.css'

// Temaet settes før første tegning, så et lyst valg ikke blinker mørkt først.
brukTema(lesTema())

// ?galleri viser illustrasjonene store, uten å starte spillet.
const galleri = new URLSearchParams(location.search).has('galleri')

createRoot(document.getElementById('root')!).render(<StrictMode>{galleri ? <Galleri /> : <App />}</StrictMode>)

registrerServiceWorker()
