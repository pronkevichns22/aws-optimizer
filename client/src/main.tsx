// ============================================================================
// FILE: main.tsx
// LOCATION: client/src/
// PURPOSE: React app entry point - renders App component to DOM
// ============================================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AWSProvider } from './context/AWSContext'

// Render the main App component to the root DOM element
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AWSProvider>
      <App />
    </AWSProvider>
  </StrictMode>,
)
