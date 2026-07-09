import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './state/store'
import { PdfApp } from './pdf/PdfApp'
import './styles.css'
import './pdf.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <PdfApp />
    </StoreProvider>
  </StrictMode>,
)
