import React, { useState, useCallback } from 'react'
import CircuitBuilder from '../components/CircuitBuilder'
import ResultChart from '../components/ResultChart'
import { useAIMessage } from '../context/AIMessageContext'

/**
 * CircuitsPage Component
 * Simple quantum circuit builder and simulator
 */
const CircuitsPage = () => {
  const { addAIMessage } = useAIMessage()
  
  // Circuit state
  const [circuit, setCircuit] = useState([])
  
  // Simulation results
  const [result, setResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Handle circuit changes
  const handleCircuitChange = useCallback((newCircuit) => {
    setCircuit(newCircuit)
    if (newCircuit.length !== circuit.length) {
      setResult(null)
    }
  }, [circuit.length])

  // Run simulation (without noise for basic circuits page)
  const handleRunSimulation = useCallback(async (circuitToSimulate) => {
    setIsSimulating(true)
    
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          circuit: circuitToSimulate,
          noise_enabled: false,
          noise_level: 0
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        
        // Generate explanation
        const p0 = data.probabilities['0']
        const p1 = data.probabilities['1']
        let explanation = `I simulated your quantum circuit: |0⟩ → ${circuitToSimulate.join(' → ')} → Measure\n\n`
        
        if (circuitToSimulate.length === 0) {
          explanation += `With no gates, the qubit remains in the |0⟩ state.`
        } else if (circuitToSimulate.join('') === 'H') {
          explanation += `The Hadamard gate creates a superposition! The qubit is now in an equal mixture of |0⟩ and |1⟩, each with 50% probability.`
        } else if (circuitToSimulate.join('') === 'X') {
          explanation += `The Pauli-X gate flips the qubit from |0⟩ to |1⟩! This is the quantum equivalent of a NOT gate.`
        } else if (circuitToSimulate.join('') === 'HH') {
          explanation += `Two Hadamard gates cancel out! The second H reverses the first, returning the qubit to |0⟩.`
        } else if (circuitToSimulate.join('') === 'HXH') {
          explanation += `This creates a Bell state! The circuit H→X applies a Hadamard then X, creating superposition and flip.`
        } else {
          explanation += `The result: P(|0⟩) = ${(p0 * 100).toFixed(1)}%, P(|1⟩) = ${(p1 * 100).toFixed(1)}%.`
        }
        
        addAIMessage(explanation)
      }
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setIsSimulating(false)
    }
  }, [addAIMessage])

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">Quantum Circuits</h1>
        <p className="page-subtitle">
          Build and simulate simple quantum circuits
        </p>
      </div>

      <div className="playground-layout">
        <div className="playground-panel playground-circuit">
          <CircuitBuilder 
            onCircuitChange={handleCircuitChange}
            onRunSimulation={handleRunSimulation}
          />
        </div>

        <div className="playground-panel playground-results">
          <div className="results-section">
            {isSimulating ? (
              <div className="simulation-loading">
                <div className="loading-spinner"></div>
                <span>Running quantum simulation...</span>
              </div>
            ) : result ? (
              <ResultChart 
                result={result}
                noiseEnabled={false}
                noiseLevel={0}
              />
            ) : (
              <div className="results-empty">
                <div className="empty-icon">⚛</div>
                <h3>Ready to Simulate</h3>
                <p>Build a quantum circuit and click "Run Simulation" to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CircuitsPage
