import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registrerServiceWorker } from './pwa'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registrerServiceWorker()
