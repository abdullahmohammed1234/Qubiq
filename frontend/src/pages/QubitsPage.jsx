import React from 'react'
import QubitViewer from '../components/QubitViewer'

/**
 * QubitsPage Component
 * Main page for visualizing and interacting with qubits
 */
const QubitsPage = () => {
  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">Qubit Viewer</h1>
        <p className="page-subtitle">
          Explore quantum states on the Bloch sphere representation
        </p>
      </div>

      {/* Interactive Qubit Visualization */}
      <QubitViewer />

      {/* Info Panel */}
      <div className="glass-panel" style={{ 
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div>
          <h3 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            color: 'var(--color-accent-primary)',
            marginBottom: '8px'
          }}>
            What is the Bloch Sphere?
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            The Bloch sphere is a geometrical representation of the pure state space 
            of a two-level quantum mechanical system. Each point on the sphere 
            represents a unique quantum state.
          </p>
        </div>
        <div>
          <h3 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            color: 'var(--color-accent-primary)',
            marginBottom: '8px'
          }}>
            Understanding θ (Theta)
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            The polar angle θ determines the probability of measuring |0⟩ or |1⟩. 
            At θ=0, the state is |0⟩; at θ=π, it's |1⟩; at θ=π/2, 
            we have an equal superposition.
          </p>
        </div>
        <div>
          <h3 style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            color: 'var(--color-accent-primary)',
            marginBottom: '8px'
          }}>
            Understanding φ (Phi)
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            The azimuthal angle φ represents the phase of the quantum state. 
            Different phases are not observable directly but affect quantum 
            interference in computations.
          </p>
        </div>
      </div>
    </div>
  )
}

export default QubitsPage
