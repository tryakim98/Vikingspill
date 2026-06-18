import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { captureFeedbackOkt } from './lib/feedback'

// Fang ?okt-øktmerket fra URL-en før ruteren redirecter og stripper query-strengen.
captureFeedbackOkt()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
