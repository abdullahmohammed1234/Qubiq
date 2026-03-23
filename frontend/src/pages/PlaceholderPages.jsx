import React from 'react'

/**
 * PlaceholderPage Component
 * Used for pages that are not yet implemented
 */
const PlaceholderPage = ({ title, icon, description }) => {
  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">
          {description}
        </p>
      </div>

      <div className="glass-panel" style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div className="placeholder-icon" style={{ fontSize: '80px' }}>
          {icon}
        </div>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-text">
          This feature is coming soon! Stay tuned for interactive quantum circuit building, 
          error simulation, and virtual quantum experiments.
        </p>
      </div>
    </div>
  )
}

// Circuits Page
export const CircuitsPage = () => (
  <PlaceholderPage 
    title="Quantum Circuits" 
    icon="⊞"
    description="Build and simulate quantum circuits"
  />
)

// Error Playground Page
export const ErrorPlaygroundPage = () => (
  <PlaceholderPage 
    title="Error Playground" 
    icon="⚡"
    description="Explore quantum errors and decoherence"
  />
)

// Quantum Lab Page
export const QuantumLabPage = () => (
  <PlaceholderPage 
    title="Quantum Lab" 
    icon="⚗"
    description="Run quantum experiments and algorithms"
  />
)

export default PlaceholderPage
