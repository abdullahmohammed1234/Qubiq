import React, { useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AIMessageProvider } from './context/AIMessageContext'
import Sidebar from './components/Sidebar'
import TutorPanel from './components/TutorPanel'
import HomePage from './pages/HomePage'
import QubitsPage from './pages/QubitsPage'
import CircuitsPage from './pages/CircuitsPage'
import QuantumErrorPlayground from './components/QuantumErrorPlayground'
import QuantumLabPage from './pages/QuantumLab'

/**
 * AppContent - Main application layout with routing
 * Combines sidebar navigation, main content area, and AI tutor panel
 */
const AppContent = () => {
  const location = useLocation()
  const tutorPanelRef = useRef(null)
  
  // Show tutor panel on all pages
  const showTutorPanel = true

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area with Router */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/qubits" element={<QubitsPage />} />
          <Route path="/circuits" element={<CircuitsPage />} />
          <Route path="/error-playground" element={<QuantumErrorPlayground />} />
          <Route path="/quantum-lab" element={<QuantumLabPage />} />
        </Routes>
      </main>

      {/* AI Tutor Panel - Always visible on the right */}
      {showTutorPanel && <TutorPanel ref={tutorPanelRef} />}
    </div>
  )
}

/**
 * App - Root component with BrowserRouter and AI Message Provider
 */
const App = () => {
  return (
    <BrowserRouter>
      <AIMessageProvider>
        <AppContent />
      </AIMessageProvider>
    </BrowserRouter>
  )
}

export default App
