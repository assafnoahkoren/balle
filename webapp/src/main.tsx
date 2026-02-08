import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import DispensaryPage from './pages/DispensaryPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/:dispensaryId" element={<DispensaryPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
