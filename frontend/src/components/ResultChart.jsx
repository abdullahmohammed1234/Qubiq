import React from 'react'

/**
 * ResultChart Component
 * Displays quantum simulation results as a probability bar chart
 * Shows the probability distribution for |0⟩ and |1⟩ states
 */
const ResultChart = ({ result, noiseEnabled, noiseLevel }) => {
  // Extract probabilities
  const probabilities = result?.probabilities || { '0': 0.5, '1': 0.5 }
  const p0 = probabilities['0'] || 0
  const p1 = probabilities['1'] || 0
  const circuit = result?.circuit || []
  const shots = result?.shots || 1000

  // Format probability as percentage
  const formatPercent = (val) => `${(val * 100).toFixed(1)}%`

  return (
    <div className="result-chart">
      {/* Header */}
      <div className="result-header">
        <h3 className="section-title">Simulation Results</h3>
        <div className="result-meta">
          <span className="result-shots">{shots} shots</span>
          {noiseEnabled && (
            <span className="result-noise-badge">
              ⚡ Noise: {(noiseLevel * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Circuit Summary */}
      <div className="result-circuit-summary">
        <span className="circuit-summary-label">Circuit:</span>
        <span className="circuit-summary-value">
          |0⟩ → {circuit.length > 0 ? circuit.join(' → ') : 'I'} → Measure
        </span>
      </div>

      {/* Bar Chart */}
      <div className="probability-chart">
        {/* |0⟩ Bar */}
        <div className="probability-row">
          <div className="probability-label">
            <span className="ket-symbol">|0⟩</span>
            <span className="probability-value">{formatPercent(p0)}</span>
          </div>
          <div className="probability-bar-container">
            <div 
              className="probability-bar probability-bar-0"
              style={{ width: `${p0 * 100}%` }}
            >
              <div className="probability-bar-glow"></div>
            </div>
          </div>
        </div>

        {/* |1⟩ Bar */}
        <div className="probability-row">
          <div className="probability-label">
            <span className="ket-symbol">|1⟩</span>
            <span className="probability-value">{formatPercent(p1)}</span>
          </div>
          <div className="probability-bar-container">
            <div 
              className="probability-bar probability-bar-1"
              style={{ width: `${p1 * 100}%` }}
            >
              <div className="probability-bar-glow"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum State Explanation */}
      <div className="result-explanation">
        <h4 className="explanation-title">Quantum State</h4>
        <div className="state-equation">
          <span className="state-ket">|ψ⟩</span>
          <span className="state-equals">=</span>
          <span className="state-coeff">
            {p0 > 0 ? `${p0.toFixed(3)}` : '0'} |0⟩
          </span>
          <span className="state-plus">+</span>
          <span className="state-coeff">
            {p1 > 0 ? `${p1.toFixed(3)}` : '0'} |1⟩
          </span>
        </div>
        <div className="state-normalization">
          |α|² + |β|² = {(p0 + p1).toFixed(3)} {Math.abs(p0 + p1 - 1) < 0.01 ? '✓' : '⚠'}
        </div>
      </div>

      {/* Visual representation of the qubit */}
      <div className="qubit-visualization">
        <div className="qubit-bloch-indicator">
          <div className="bloch-sphere-mini">
            <div className="bloch-axis bloch-x"></div>
            <div className="bloch-axis bloch-y"></div>
            <div className="bloch-axis bloch-z"></div>
            <div 
              className="bloch-state-dot"
              style={{
                transform: `rotate(${(Math.atan2(p1, p0) * 180 / Math.PI) - 90}deg) translateY(-${(Math.abs(p1 - p0) * 40)}px)`
              }}
            ></div>
          </div>
          <div className="bloch-labels">
            <span className="bloch-label-top">|0⟩</span>
            <span className="bloch-label-bottom">|1⟩</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultChart
