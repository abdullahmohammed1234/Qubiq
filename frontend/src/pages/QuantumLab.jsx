import React, { useState, useCallback, useEffect } from 'react'
import CircuitBuilder from '../components/CircuitBuilder'
import ResultChart from '../components/ResultChart'
import { useAIMessage } from '../context/AIMessageContext'

/**
 * Quantum Lab Challenges Configuration
 * Each challenge includes title, goal description, success conditions, and hints
 */
const CHALLENGES = [
  {
    id: 1,
    title: 'Create Superposition',
    goal: 'Create a quantum superposition state where the qubit has equal probability of being measured as |0⟩ or |1⟩.',
    successCondition: (circuit, result) => {
      // Superposition: equal probabilities (within 5% tolerance)
      const p0 = result?.probabilities?.['0'] || 0
      const p1 = result?.probabilities?.['1'] || 0
      return Math.abs(p0 - 0.5) < 0.05 && Math.abs(p1 - 0.5) < 0.05
    },
    hint: 'The Hadamard (H) gate creates superposition by putting the qubit in an equal mixture of |0⟩ and |1⟩.',
    gateHint: 'H',
    difficulty: 'beginner',
    points: 100
  },
  {
    id: 2,
    title: 'Flip the Qubit',
    goal: 'Flip the qubit from the initial |0⟩ state to |1⟩.',
    successCondition: (circuit, result) => {
      // Flip: probability of |1⟩ should be > 90%
      const p1 = result?.probabilities?.['1'] || 0
      return p1 > 0.9
    },
    hint: 'The Pauli-X gate (X) acts like a quantum NOT gate, flipping |0⟩ to |1⟩ and vice versa.',
    gateHint: 'X',
    difficulty: 'beginner',
    points: 100
  },
  {
    id: 3,
    title: 'Return to Origin',
    goal: 'Apply two gates that cancel each other out and return the qubit to the |0⟩ state.',
    successCondition: (circuit, result) => {
      // Should return to |0⟩ (probability of |0⟩ > 90%)
      const p0 = result?.probabilities?.['0'] || 0
      return p0 > 0.9 && circuit.length >= 2
    },
    hint: 'Two Hadamard gates (HH) cancel each other out - the second H reverses the first, returning to |0⟩.',
    gateHint: 'H then H',
    difficulty: 'beginner',
    points: 150
  },
  {
    id: 4,
    title: 'Phase Shift',
    goal: 'Create a quantum state where the qubit is in superposition but with different phase relationships.',
    successCondition: (circuit, result) => {
      // Check if Z gate was applied (changes phase but not probabilities)
      const hasZ = circuit.includes('Z')
      const hasH = circuit.includes('H')
      return hasZ && hasH
    },
    hint: 'The Pauli-Z gate (Z) applies a phase flip. Try combining H and Z gates!',
    gateHint: 'H then Z',
    difficulty: 'intermediate',
    points: 200
  },
  {
    id: 5,
    title: 'Quantum Magic',
    goal: 'Create a circuit that produces a |1⟩ state from |0⟩ using a different approach than the X gate.',
    successCondition: (circuit, result) => {
      // Use Y gate (bit and phase flip) to get to |1⟩
      const p1 = result?.probabilities?.['1'] || 0
      const hasY = circuit.includes('Y')
      return p1 > 0.9 && hasY
    },
    hint: 'The Pauli-Y gate (Y) performs both a bit flip and phase flip - it will take |0⟩ to |i⟩ then to |1⟩ after measurement.',
    gateHint: 'Y',
    difficulty: 'intermediate',
    points: 250
  }
]

/**
 * QuantumLabPage Component
 * Gamified quantum learning experience with challenges
 */
const QuantumLabPage = () => {
  const { addAIMessage } = useAIMessage()
  
  // Challenge state
  const [currentChallenge, setCurrentChallenge] = useState(0)
  const [completedChallenges, setCompletedChallenges] = useState([])
  const [challengeStatus, setChallengeStatus] = useState('in-progress') // 'in-progress', 'success', 'failed'
  const [showHint, setShowHint] = useState(false)
  
  // Circuit and simulation state
  const [circuit, setCircuit] = useState([])
  const [result, setResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  
  // Demo mode state - disabled
  const [isDemoMode] = useState(false)
  const [demoStep] = useState(0)
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false)
  
  // Points and progress
  const [totalPoints, setTotalPoints] = useState(0)
  
  const challenge = CHALLENGES[currentChallenge]

  // Demo mode disabled - kept for future use

  // Handle circuit changes
  const handleCircuitChange = useCallback((newCircuit) => {
    setCircuit(newCircuit)
    // Reset challenge status when circuit changes
    if (challengeStatus !== 'in-progress') {
      setChallengeStatus('in-progress')
    }
  }, [challengeStatus])

  // Run simulation and check challenge
  const handleRunSimulation = useCallback(async (circuitToSimulate) => {
    setIsSimulating(true)
    setShowHint(false)
    
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
        
        // Generate explanation based on the circuit
        const explanation = generateCircuitExplanation(circuitToSimulate, data)
        addAIMessage(explanation)
        
        // Check if challenge is completed
        if (challenge.successCondition(circuitToSimulate, data)) {
          setChallengeStatus('success')
          const newPoints = totalPoints + challenge.points
          setTotalPoints(newPoints)
          
          if (!completedChallenges.includes(challenge.id)) {
            setCompletedChallenges(prev => [...prev, challenge.id])
          }
          
          // Add success message to AI tutor
          addAIMessage(`🎉 Congratulations! You've completed "${challenge.title}"! +${challenge.points} points!`)
        } else {
          setChallengeStatus('failed')
          addAIMessage(`Not quite right. ${challenge.hint} Keep trying!`)
        }
      }
    } catch (error) {
      console.error('Simulation error:', error)
      addAIMessage('Oops! Something went wrong with the simulation. Please try again.')
    } finally {
      setIsSimulating(false)
    }
  }, [challenge, completedChallenges, totalPoints, addAIMessage])

  // Generate contextual explanation for the circuit
  const generateCircuitExplanation = (circuit, result) => {
    const circuitStr = circuit.join('')
    const p0 = result.probabilities['0']
    const p1 = result.probabilities['1']
    
    let explanation = `I simulated your quantum circuit: |0⟩ → ${circuit.join(' → ')} → Measure\n\n`
    
    // Specific explanations for different circuits
    if (circuitStr === 'H') {
      explanation += `✨ The Hadamard gate creates superposition! The qubit is now in an equal mixture of |0⟩ and |1⟩, each with 50% probability. This is one of the most important gates in quantum computing!`
    } else if (circuitStr === 'X') {
      explanation += `🔄 The Pauli-X gate flips the qubit from |0⟩ to |1⟩! This is the quantum equivalent of a classical NOT gate.`
    } else if (circuitStr === 'Z') {
      explanation += `📐 The Pauli-Z gate applies a phase flip. It leaves |0⟩ unchanged but adds a minus sign to |1⟩. The probabilities stay the same, but the quantum phase changes!`
    } else if (circuitStr === 'Y') {
      explanation += `🔮 The Pauli-Y gate is a combination of X and Z - it performs both a bit flip and a phase flip!`
    } else if (circuitStr === 'HH') {
      explanation += `🔙 Two Hadamard gates cancel out! The second H reverses the first, returning the qubit to its original |0⟩ state.`
    } else if (circuitStr === 'HZ') {
      explanation += `🎯 You created a different superposition! The H creates superposition, then Z modifies the phase. This creates a state with different phase relationships.`
    } else if (circuitStr === 'ZH') {
      explanation += `🎲 Another interesting circuit! The Z gate changes the phase first, then H creates superposition with that phase offset.`
    } else if (circuit.length === 0) {
      explanation += `With no gates, the qubit remains in the initial |0⟩ state.`
    } else {
      explanation += `The result: P(|0⟩) = ${(p0 * 100).toFixed(1)}%, P(|1⟩) = ${(p1 * 100).toFixed(1)}%. `
      explanation += `That's interesting - you've built a custom quantum circuit!`
    }
    
    return explanation
  }

  // Handle hint request
  const handleShowHint = useCallback(() => {
    setShowHint(true)
    addAIMessage(`💡 Hint: ${challenge.hint}`)
  }, [challenge, addAIMessage])

  // Move to next challenge
  const handleNextChallenge = useCallback(() => {
    if (currentChallenge < CHALLENGES.length - 1) {
      setCurrentChallenge(prev => prev + 1)
      setChallengeStatus('in-progress')
      setCircuit([])
      setResult(null)
      setShowHint(false)
      setDemoStep(0)
      addAIMessage(`Great job! Now let's try challenge ${currentChallenge + 2}: "${CHALLENGES[currentChallenge + 1].title}"`)
    }
  }, [currentChallenge, addAIMessage])

  // Handle all challenges completed - show celebration
  const handleAllComplete = useCallback(() => {
    setShowCelebration(true)
    addAIMessage(`🎊 CONGRATULATIONS! 🎊\n\nYou've completed all ${CHALLENGES.length} quantum challenges and earned ${totalPoints} points!\n\nYou're now a quantum computing wizard! The world of quantum computing awaits you.`)
    
    // Hide celebration after animation
    setTimeout(() => {
      setShowCelebration(false)
    }, 3000)
  }, [totalPoints, addAIMessage])

  // Demo mode disabled

  // Reset current challenge
  const handleResetChallenge = useCallback(() => {
    setCircuit([])
    setResult(null)
    setChallengeStatus('in-progress')
    setShowHint(false)
  }, [])

  // Calculate progress percentage
  const progressPercent = ((currentChallenge + 1) / CHALLENGES.length) * 100

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header">
        <div className="quantum-lab-header">
          <div className="header-info">
            <h1 className="page-title">Quantum Lab</h1>
            <p className="page-subtitle">
              Learn quantum computing through interactive challenges
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Points</span>
              <span className="stat-value">{totalPoints}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Progress</span>
              <span className="stat-value">{completedChallenges.length}/{CHALLENGES.length}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>



      <div className="playground-layout">
        {/* Challenge Panel */}
        <div className="playground-panel challenge-panel">
          {/* Challenge Card */}
          <div className="challenge-card">
            <div className="challenge-header">
              <div className="challenge-number">Challenge {currentChallenge + 1}</div>
              <div className="challenge-difficulty">{challenge.difficulty}</div>
            </div>
            
            <h2 className="challenge-title">{challenge.title}</h2>
            <p className="challenge-goal">{challenge.goal}</p>
            
            <div className="challenge-meta">
              <span className="challenge-points">🏆 {challenge.points} points</span>
            </div>

            {/* Challenge Status */}
            {challengeStatus === 'success' && (
              <div className="challenge-success">
                <div className="success-icon">✓</div>
                <div className="success-message">
                  {currentChallenge === CHALLENGES.length - 1 ? 'All Challenges Completed!' : 'Challenge Complete!'}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={currentChallenge === CHALLENGES.length - 1 ? handleAllComplete : handleNextChallenge}
                >
                  {currentChallenge === CHALLENGES.length - 1 ? '🎉 Challenges Completed!' : 'Next Challenge →'}
                </button>
              </div>
            )}
            
            {challengeStatus === 'failed' && (
              <div className="challenge-failed">
                <div className="failed-icon">↻</div>
                <div className="failed-message">Not quite right. Try again!</div>
              </div>
            )}

            {/* Hint Button */}
            {challengeStatus !== 'success' && (
              <div className="challenge-actions">
                <button 
                  className="btn btn-hint"
                  onClick={handleShowHint}
                  disabled={showHint}
                >
                  {showHint ? '💡 ' + challenge.hint : '💡 Show Hint'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleResetChallenge}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Circuit Builder */}
          <CircuitBuilder 
            onCircuitChange={handleCircuitChange}
            onRunSimulation={handleRunSimulation}
          />
        </div>

        {/* Results Panel */}
        <div className="playground-panel playground-results">
          <div className="results-section">
            {isDemoMode ? (
              <div className="demo-mode-indicator">
                <div className="demo-spinner"></div>
                <span>Follow the AI tutor's guidance...</span>
              </div>
            ) : isSimulating ? (
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
                <h3>Ready for Challenge</h3>
                <p>Build your quantum circuit and click "Run Simulation" to test your solution</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenge List (Completed) */}
      <div className="challenges-completed">
        <h3 className="completed-title">Completed Challenges</h3>
        <div className="completed-list">
          {CHALLENGES.map((c, index) => (
            <div 
              key={c.id} 
              className={`completed-item ${completedChallenges.includes(c.id) ? 'done' : ''} ${index === currentChallenge ? 'current' : ''}`}
              onClick={() => {
                setCurrentChallenge(index)
                setChallengeStatus('in-progress')
                setCircuit([])
                setResult(null)
              }}
            >
              <span className="completed-number">{index + 1}</span>
              <span className="completed-name">{c.title}</span>
              <span className="completed-check">{completedChallenges.includes(c.id) ? '✓' : '○'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <h2 className="celebration-title">Congratulations!</h2>
            <p className="celebration-text">
              You've completed all {CHALLENGES.length} challenges!
            </p>
            <p className="celebration-points">
              Total Points: {totalPoints}
            </p>
            <div className="celebration-stars">
              <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuantumLabPage
