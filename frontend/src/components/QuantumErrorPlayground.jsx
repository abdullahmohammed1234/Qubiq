import React, { useState, useCallback } from 'react'
import CircuitBuilder from './CircuitBuilder'
import ResultChart from './ResultChart'
import { useAIMessage } from '../context/AIMessageContext'

/**
 * QuantumErrorPlayground Component
 * Interactive quantum circuit simulator with noise controls
 * Allows users to build circuits and observe how noise affects quantum computation
 */
const QuantumErrorPlayground = () => {
  const { addAIMessage } = useAIMessage()
  
  // Circuit state
  const [circuit, setCircuit] = useState([])
  
  // Noise settings
  const [noiseEnabled, setNoiseEnabled] = useState(false)
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  
  // Simulation results
  const [result, setResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationError, setSimulationError] = useState(null)

  // Store previous result for comparison when noise changes
  const [previousResult, setPreviousResult] = useState(null)

  // Handle circuit changes
  const handleCircuitChange = useCallback((newCircuit) => {
    setCircuit(newCircuit)
    // Clear results when circuit changes
    if (newCircuit.length !== circuit.length) {
      setResult(null)
      setSimulationError(null)
    }
  }, [circuit.length])

  // Run simulation
  const handleRunSimulation = useCallback(async (circuitToSimulate) => {
    setIsSimulating(true)
    setSimulationError(null)
    
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          circuit: circuitToSimulate,
          noise_enabled: noiseEnabled,
          noise_level: noiseLevel
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        
        // Store as previous for comparison
        setPreviousResult(result)
        
        // Generate explanation message
        generateExplanation(data, circuitToSimulate)
      } else {
        throw new Error('Simulation failed')
      }
    } catch (error) {
      console.error('Simulation error:', error)
      setSimulationError('Failed to run simulation. Please try again.')
      
      // Generate fallback explanation
      addAIMessage(
        `I ran a simulation of your quantum circuit (${circuitToSimulate.join(' → ')}), ` +
        `but couldn't connect to the quantum simulator. ` +
        `With noise ${noiseEnabled ? `enabled at ${(noiseLevel * 100).toFixed(0)}%` : 'disabled'}, ` +
        `the expected results would show how the qubit state evolves through your gates.`
      )
    } finally {
      setIsSimulating(false)
    }
  }, [noiseEnabled, noiseLevel, result, addAIMessage])

  // Generate AI explanation based on results
  const generateExplanation = useCallback((simulationResult, circuitGates) => {
    const p0 = simulationResult.probabilities['0']
    const p1 = simulationResult.probabilities['1']
    
    let explanation = `I simulated your quantum circuit: |0⟩ → ${circuitGates.join(' → ')} → Measure\n\n`
    
    if (noiseEnabled && noiseLevel > 0) {
      explanation += `With noise enabled at ${(noiseLevel * 100).toFixed(0)}% level:\n`
      
      // Explain the noise effect
      if (Math.abs(p0 - p1) < 0.1) {
        explanation += `The noise caused the qubit to become nearly balanced between |0⟩ and |1⟩ states. `
        explanation += `This is because quantum decoherence is driving the system toward a maximally mixed state. `
      } else if (noiseLevel > 0.5) {
        explanation += `At this high noise level, the quantum information is being lost! `
        explanation += `The noise is overwhelming the quantum gates, causing random flips. `
      } else {
        explanation += `The noise slightly perturbed the expected probabilities. `
        explanation += `In real quantum computers, this type of error is called "bit-flip noise" or "phase noise". `
      }
    } else {
      // No noise - explain ideal behavior
      if (circuitGates.length === 0) {
        explanation += `The qubit started in the |0⟩ state with no gates applied, so it remained there.`
      } else if (circuitGates.join('') === 'H') {
        explanation += `The Hadamard gate created a superposition! The qubit is now in an equal superposition of |0⟩ and |1⟩, represented as (|0⟩ + |1⟩)/√2.`
      } else if (circuitGates.join('') === 'X') {
        explanation += `The Pauli-X gate (quantum NOT) flipped the qubit from |0⟩ to |1⟩!`
      } else if (circuitGates.join('') === 'HX' || circuitGates.join('') === 'XH') {
        explanation += `This circuit creates a superposition and then applies X, resulting in the same probability as just H (50/50 split).`
      } else if (circuitGates.join('') === 'HH') {
        explanation += `Two Hadamard gates cancel out! The second H reverses the first, returning the qubit to |0⟩.`
      } else {
        explanation += `The final probabilities are: P(|0⟩) = ${(p0 * 100).toFixed(1)}%, P(|1⟩) = ${(p1 * 100).toFixed(1)}%.`
      }
    }
    
    explanation += `\n\n💡 This demonstrates how quantum gates manipulate qubit states, and why noise is one of the biggest challenges in building quantum computers!`
    
    addAIMessage(explanation)
  }, [noiseEnabled, noiseLevel, addAIMessage])

  // Toggle noise
  const toggleNoise = useCallback(() => {
    setNoiseEnabled(prev => !prev)
  }, [])

  // Handle noise level change
  const handleNoiseLevelChange = useCallback((e) => {
    setNoiseLevel(parseFloat(e.target.value))
  }, [])

  // Re-run simulation when noise settings change
  React.useEffect(() => {
    if (result && circuit.length > 0) {
      const timeoutId = setTimeout(() => {
        handleRunSimulation(circuit)
      }, 300) // Debounce
      return () => clearTimeout(timeoutId)
    }
  }, [noiseEnabled, noiseLevel])

  return (
    <div className="quantum-error-playground">
      <div className="content-area">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Quantum Error Playground</h1>
          <p className="page-subtitle">
            Build quantum circuits and explore how noise affects quantum computation
          </p>
        </div>

        <div className="playground-layout">
          {/* Left Panel - Circuit Builder */}
          <div className="playground-panel playground-circuit">
            <CircuitBuilder 
              onCircuitChange={handleCircuitChange}
              onRunSimulation={handleRunSimulation}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="playground-panel playground-results">
            {/* Noise Controls */}
            <div className="noise-controls">
              <div className="noise-controls-header">
                <h3 className="section-title">
                  <span className="noise-icon">⚡</span>
                  Quantum Error Simulation
                </h3>
              </div>
              
              <div className="noise-toggle-row">
                <span className="noise-toggle-label">Enable Noise</span>
                <button 
                  className={`noise-toggle ${noiseEnabled ? 'active' : ''}`}
                  onClick={toggleNoise}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb"></span>
                  </span>
                </button>
              </div>
              
              <div className={`noise-slider-row ${!noiseEnabled ? 'disabled' : ''}`}>
                <span className="noise-slider-label">Noise Level</span>
                <div className="noise-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={noiseLevel}
                    onChange={handleNoiseLevelChange}
                    disabled={!noiseEnabled}
                    className="noise-slider"
                  />
                  <span className="noise-slider-value">
                    {(noiseLevel * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="noise-description">
                {noiseEnabled 
                  ? "Noise simulates environmental interference that causes quantum decoherence."
                  : "Enable noise to see how environmental effects alter quantum computation."}
              </div>
            </div>

            {/* Results */}
            <div className="results-section">
              {isSimulating ? (
                <div className="simulation-loading">
                  <div className="loading-spinner"></div>
                  <span>Running quantum simulation...</span>
                </div>
              ) : simulationError ? (
                <div className="simulation-error">
                  <span className="error-icon">⚠</span>
                  <span>{simulationError}</span>
                </div>
              ) : result ? (
                <ResultChart 
                  result={result}
                  noiseEnabled={noiseEnabled}
                  noiseLevel={noiseLevel}
                />
              ) : (
                <div className="results-empty">
                  <div className="empty-icon">⚛</div>
                  <h3>Ready to Simulate</h3>
                  <p>Build a quantum circuit and click "Run Simulation" to see the results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuantumErrorPlayground
