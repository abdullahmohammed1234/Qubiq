import React, { useState } from 'react'

/**
 * CircuitBuilder Component
 * Allows users to build a simple 1-qubit quantum circuit
 * with Hadamard and Pauli-X gates
 */
const CircuitBuilder = ({ onCircuitChange, onRunSimulation }) => {
  // Circuit state - array of gate names
  const [circuit, setCircuit] = useState([])
  
  // Available gates
  const availableGates = [
    { name: 'H', label: 'Hadamard (H)', description: 'Creates superposition' },
    { name: 'X', label: 'Pauli-X (X)', description: 'Quantum NOT gate' },
    { name: 'Z', label: 'Pauli-Z (Z)', description: 'Phase flip' },
    { name: 'Y', label: 'Pauli-Y (Y)', description: 'Bit and phase flip' },
    { name: 'S', label: 'Phase (S)', description: 'π/2 phase gate' },
    { name: 'T', label: 'T Gate (T)', description: 'π/4 phase gate' },
  ]

  // Add a gate to the circuit
  const addGate = (gateName) => {
    const newCircuit = [...circuit, gateName]
    setCircuit(newCircuit)
    onCircuitChange?.(newCircuit)
  }

  // Remove a gate from the circuit
  const removeGate = (index) => {
    const newCircuit = circuit.filter((_, i) => i !== index)
    setCircuit(newCircuit)
    onCircuitChange?.(newCircuit)
  }

  // Clear the entire circuit
  const clearCircuit = () => {
    setCircuit([])
    onCircuitChange?.([])
  }

  // Run simulation
  const runSimulation = () => {
    if (circuit.length > 0) {
      onRunSimulation?.(circuit)
    }
  }

  return (
    <div className="circuit-builder">
      {/* Header */}
      <div className="circuit-builder-header">
        <h3 className="section-title">Circuit Builder</h3>
        <p className="section-description">
          Add quantum gates to build your 1-qubit circuit
        </p>
      </div>

      {/* Gate Buttons */}
      <div className="gate-buttons-container">
        <div className="gate-buttons-label">Available Gates</div>
        <div className="gate-buttons-grid">
          {availableGates.map((gate) => (
            <button
              key={gate.name}
              className="gate-button"
              onClick={() => addGate(gate.name)}
              title={gate.description}
            >
              <span className="gate-symbol">{gate.name}</span>
              <span className="gate-label">{gate.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Circuit Display */}
      <div className="circuit-display-container">
        <div className="circuit-display-header">
          <span className="circuit-label">Current Circuit</span>
          <span className="circuit-length">{circuit.length} gate(s)</span>
        </div>
        
        <div className="circuit-display">
          {circuit.length === 0 ? (
            <div className="circuit-empty">
              <span className="circuit-empty-icon">⚛</span>
              <span>Click gates above to build your circuit</span>
            </div>
          ) : (
            <div className="circuit-sequence">
              {/* Start state */}
              <div className="circuit-element circuit-start">
                <span className="circuit-element-symbol">|0⟩</span>
              </div>
              
              {/* Gate sequence with arrows */}
              {circuit.map((gate, index) => (
                <React.Fragment key={index}>
                  <div className="circuit-arrow">→</div>
                  <div 
                    className="circuit-element circuit-gate"
                    onClick={() => removeGate(index)}
                    title="Click to remove"
                  >
                    <span className="circuit-element-symbol">{gate}</span>
                    <span className="circuit-element-remove">×</span>
                  </div>
                </React.Fragment>
              ))}
              
              {/* Measurement */}
              {circuit.length > 0 && (
                <>
                  <div className="circuit-arrow">→</div>
                  <div className="circuit-element circuit-measure">
                    <span className="circuit-element-symbol">⟨M⟨</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="circuit-actions">
        <button 
          className="btn btn-secondary"
          onClick={clearCircuit}
          disabled={circuit.length === 0}
        >
          Clear Circuit
        </button>
        <button 
          className="btn btn-primary"
          onClick={runSimulation}
          disabled={circuit.length === 0}
        >
          ▶ Run Simulation
        </button>
      </div>

      {/* CSS Styles are in index.css */}
    </div>
  )
}

export default CircuitBuilder
