import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useAIMessage } from '../context/AIMessageContext'

/**
 * BlochSphere - Interactive 3D visualization of a quantum qubit state
 * Uses Three.js via @react-three/fiber to render a sphere with axes and state vector
 */
const BlochSphere = ({ theta, phi }) => {
  // Axis colors - quantum-themed
  const axisColor = '#00d4ff'
  const sphereColor = '#8b5cf6'
  const gridColor = 'rgba(0, 212, 255, 0.12)'

  // Calculate state vector position
  const statePosition = useMemo(() => {
    const r = 2.5
    const x = r * Math.sin(theta) * Math.cos(phi)
    const y = r * Math.sin(theta) * Math.sin(phi)
    const z = r * Math.cos(theta)
    return [x, y, z]
  }, [theta, phi])

  return (
    <group>
      {/* Main Sphere - Transparent with glow effect */}
      <Sphere args={[2.5, 64, 64]}>
        <MeshDistortMaterial
          color={sphereColor}
          transparent
          opacity={0.12}
          distort={0.1}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Inner sphere for depth */}
      <Sphere args={[2.48, 32, 32]}>
        <meshStandardMaterial
          color="#0a0e17"
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Coordinate Axes with labels */}
      {/* X Axis - represents Pauli-X (bit flip) */}
      <Line
        points={[[-3.5, 0, 0], [3.5, 0, 0]]}
        color="#ef4444"
        lineWidth={2}
      />
      <Text position={[3.8, 0, 0]} fontSize={0.28} color="#ef4444">X</Text>
      
      {/* Y Axis - represents Pauli-Y */}
      <Line
        points={[[0, -3.5, 0], [0, 3.5, 0]]}
        color="#22c55e"
        lineWidth={2}
      />
      <Text position={[0, 3.8, 0]} fontSize={0.28} color="#22c55e">Y</Text>
      
      {/* Z Axis - represents Pauli-Z (phase) - |0⟩ and |1⟩ poles */}
      <Line
        points={[[0, 0, -3.5], [0, 0, 3.5]]}
        color={axisColor}
        lineWidth={2}
      />
      <Text position={[0, 0, 3.8]} fontSize={0.28} color={axisColor}>|0⟩</Text>
      <Text position={[0, 0, -3.8]} fontSize={0.28} color={axisColor}>|1⟩</Text>

      {/* Latitude Circles (for depth perception) */}
      {[...Array(5)].map((_, i) => (
        <Line
          key={`lat-${i}`}
          points={new THREE.EllipseCurve(
            0, 0, 
            2.5 * Math.cos((i + 1) * Math.PI / 12), 
            2.5 * Math.cos((i + 1) * Math.PI / 12), 
            0, 2 * Math.PI, false, 0
          ).getPoints(64).map(p => [p.x, 0, p.y])}
          color={gridColor}
          lineWidth={1}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}

      {/* Longitude Circles */}
      {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle, i) => (
        <Line
          key={`lon-${i}`}
          points={new THREE.EllipseCurve(0, 0, 2.5, 2.5, 0, 2 * Math.PI, false, 0)
            .getPoints(64)
            .map(p => [p.x, p.y, 0])}
          color={gridColor}
          lineWidth={1}
          rotation={[0, angle, 0]}
        />
      ))}

      {/* State Arrow - from center to state position */}
      <StateArrow theta={theta} phi={phi} />

      {/* State Indicator on sphere surface */}
      <Sphere args={[0.12, 32, 32]} position={statePosition}>
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff" 
          emissiveIntensity={1.5}
        />
      </Sphere>
      {/* Glow effect */}
      <Sphere args={[0.2, 16, 16]} position={statePosition}>
        <meshBasicMaterial 
          color="#00ffff" 
          transparent 
          opacity={0.3}
        />
      </Sphere>
    </group>
  )
}

/**
 * StateArrow - Animated arrow showing qubit state direction
 */
const StateArrow = ({ theta, phi }) => {
  const arrowRef = useRef()
  const targetRef = useRef({ theta, phi })
  
  useEffect(() => {
    targetRef.current = { theta, phi }
  }, [theta, phi])

  useFrame((state, delta) => {
    if (!arrowRef.current) return
    
    const lerpSpeed = 5 * delta
    
    // Calculate current direction
    const currentDir = arrowRef.current.quaternion.clone()
    
    // Calculate target direction
    const r = 2.5
    const x = r * Math.sin(targetRef.current.theta) * Math.cos(targetRef.current.phi)
    const y = r * Math.sin(targetRef.current.theta) * Math.sin(targetRef.current.phi)
    const z = r * Math.cos(targetRef.current.theta)
    
    const targetPos = new THREE.Vector3(x, y, z).normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPos)
    
    // Lerp quaternion
    arrowRef.current.quaternion.slerp(targetQuat, lerpSpeed)
  })

  return (
    <group ref={arrowRef}>
      {/* Arrow shaft */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.3, 16]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff" 
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[0.12, 0.35, 16]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff" 
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  )
}

/**
 * Scene lighting and environment
 */
const SceneEnvironment = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#ffffff" />
    </>
  )
}

/**
 * QuantumGateButton - Styled button for gate operations
 */
const QuantumGateButton = ({ onClick, disabled, children, variant = 'primary' }) => {
  const baseStyles = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      color: '#fff',
      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
    },
    secondary: {
      background: 'linear-gradient(135deg, #00d4ff 0%, #06b6d4 100%)',
      color: '#0a0e17',
      boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)'
    },
    reset: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#94a3b8',
      border: '1px solid rgba(148, 163, 184, 0.3)'
    }
  }

  const style = { 
    ...baseStyles, 
    ...variants[variant],
    opacity: disabled ? 0.5 : 1
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={style}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = variant === 'reset' 
            ? '0 6px 20px rgba(255, 255, 255, 0.1)'
            : '0 6px 25px rgba(139, 92, 246, 0.6)'
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = variants[variant].boxShadow
      }}
    >
      {children}
    </button>
  )
}

/**
 * QubitViewer Component
 * Main 3D visualization container with interactive controls and gate operations
 */
const QubitViewer = () => {
  const { addAIMessage } = useAIMessage()
  
  // Current quantum state - use refs for smooth animation
  const [theta, setTheta] = useState(0)  // |0⟩ state - up
  const [phi, setPhi] = useState(0)
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentGate, setCurrentGate] = useState('|0⟩')

  // Animation frame ref
  const animFrameRef = useRef(null)
  const targetThetaRef = useRef(0)
  const targetPhiRef = useRef(0)
  const currentThetaRef = useRef(0)
  const currentPhiRef = useRef(0)

  // Animation loop - separate from React state for smooth updates
  useEffect(() => {
    let running = true
    
    const animate = () => {
      if (!running) return
      
      const thetaDiff = targetThetaRef.current - currentThetaRef.current
      const phiDiff = targetPhiRef.current - currentPhiRef.current
      
      // Handle phi wraparound
      let adjustedPhiDiff = phiDiff
      if (adjustedPhiDiff > Math.PI) adjustedPhiDiff -= 2 * Math.PI
      if (adjustedPhiDiff < -Math.PI) adjustedPhiDiff += 2 * Math.PI
      
      const threshold = 0.001
      const speed = 0.08
      
      if (Math.abs(thetaDiff) > threshold || Math.abs(adjustedPhiDiff) > threshold) {
        currentThetaRef.current += thetaDiff * speed
        currentPhiRef.current += adjustedPhiDiff * speed
        setTheta(currentThetaRef.current)
        setPhi(currentPhiRef.current)
        setIsAnimating(true)
      } else {
        if (isAnimating) {
          currentThetaRef.current = targetThetaRef.current
          currentPhiRef.current = targetPhiRef.current
          setTheta(currentThetaRef.current)
          setPhi(currentPhiRef.current)
          setIsAnimating(false)
        }
      }
      
      animFrameRef.current = requestAnimationFrame(animate)
    }
    
    animFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      running = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isAnimating])

  // Calculate probabilities - use useMemo but don't depend on theta/phi for rendering
  const probabilities = useMemo(() => {
    const prob0 = Math.cos(theta / 2) ** 2 * 100
    const prob1 = Math.sin(theta / 2) ** 2 * 100
    return { prob0: prob0.toFixed(1), prob1: prob1.toFixed(1) }
  }, [theta])

  // Calculate phase
  const phase = useMemo(() => {
    return (phi * 180 / Math.PI).toFixed(1)
  }, [phi])

  /**
   * Determine state label based on theta and phi angles
   * |0⟩ = north pole (theta = 0)
   * |1⟩ = south pole (theta = π)
   * Superposition = equator (theta ≈ π/2)
   */
  const stateLabel = useMemo(() => {
    const thetaDeg = theta * 180 / Math.PI
    const phiDeg = phi * 180 / Math.PI
    
    // Check if near |0⟩ state (north pole)
    if (Math.abs(thetaDeg) < 5 || Math.abs(thetaDeg - 360) < 5) {
      return '|0⟩'
    }
    // Check if near |1⟩ state (south pole)
    if (Math.abs(thetaDeg - 180) < 5) {
      return '|1⟩'
    }
    // Check if near superposition (equator)
    if (Math.abs(thetaDeg - 90) < 20 || Math.abs(thetaDeg - 270) < 20) {
      return 'Superposition'
    }
    // Custom state
    return 'Custom'
  }, [theta, phi])

  /**
   * Apply Hadamard Gate
   * Apply Hadamard Gate
   * Creates superposition - moves from |0⟩ to |+⟩ (equator)
   */
  const applyHadamardGate = () => {
    targetThetaRef.current = Math.PI / 2
    targetPhiRef.current = 0
    setCurrentGate('H')
    
    addAIMessage("🔮 **Hadamard Gate Applied!**\n\nThe Hadamard gate creates a quantum superposition, transforming the qubit from a definite state |0⟩ to an equal superposition |+⟩. \n\n**What happened:**\n• The vector moved from the north pole (|0⟩) to the equator of the sphere\n• Now the qubit has **50% probability** of being measured as |0⟩ and **50%** as |1⟩\n• This is the foundation of quantum computing - superposition allows qubits to exist in multiple states simultaneously!")
  }

  /**
   * Reset State
   * Returns to |0⟩ state (north pole)
   */
  const resetState = () => {
    targetThetaRef.current = 0
    targetPhiRef.current = 0
    setCurrentGate('|0⟩')
    
    addAIMessage("🔄 **State Reset!**\n\nThe qubit has been reset to its initial |0⟩ state (the computational basis state).\n\n**What this means:**\n• The vector now points to the north pole of the Bloch sphere\n• The qubit has **100% probability** of being measured as |0⟩\n• This is like starting fresh - ready for new quantum operations!")
  }

  /**
   * Apply X Gate (Pauli-X - bit flip)
   */
  const applyXGate = () => {
    targetThetaRef.current = Math.PI
    targetPhiRef.current = 0
    setCurrentGate('X')
    
    addAIMessage("⚡ **Pauli-X Gate Applied!**\n\nThe Pauli-X gate is the quantum equivalent of a NOT gate - it flips the qubit state!\n\n**What happened:**\n• The vector flipped from |0⟩ (north pole) to |1⟩ (south pole)\n• This is like classical bit flipping: 0 → 1, 1 → 0\n• In quantum terms, this is a rotation of π around the X-axis")
  }

  /**
   * Apply Z Gate (Pauli-Z - phase flip)
   */
  const applyZGate = () => {
    targetThetaRef.current = Math.PI / 2
    targetPhiRef.current = Math.PI
    setCurrentGate('Z')
    
    addAIMessage("🌀 **Pauli-Z Gate Applied!**\n\nThe Pauli-Z gate applies a phase flip!\n\n**What happened:**\n• The vector stayed on the equator (superposition)\n• The phase changed by π (180°)\n• |+⟩ became |−⟩\n\n**Note:** The measurement probabilities didn't change (still 50/50), but the quantum phase is different - this is crucial for quantum interference!")
  }

  // Handle angle slider changes - update directly without triggering animation
  const handleThetaChange = useCallback((e) => {
    const val = parseFloat(e.target.value)
    targetThetaRef.current = val
    currentThetaRef.current = val
    setTheta(val)
    setCurrentGate('Custom')
  }, [])

  const handlePhiChange = useCallback((e) => {
    const val = parseFloat(e.target.value)
    targetPhiRef.current = val
    currentPhiRef.current = val
    setPhi(val)
    setCurrentGate('Custom')
  }, [])

  // Auto-rotate until user interacts
  const autoRotateRef = useRef(true)

  return (
    <div className="qubit-viewer-container">
      <Canvas
        camera={{ position: [6, 4, 6], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <SceneEnvironment />
        <BlochSphere theta={theta} phi={phi} />
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          autoRotate={autoRotateRef.current}
          autoRotateSpeed={0.5}
          dampingFactor={0.05}
          enableDamping={true}
          onStart={() => { autoRotateRef.current = false }}
        />
      </Canvas>

      {/* Quantum State Display Panel */}
      <div className="qubit-state-panel">
        <div className="state-header">
          <span className="state-indicator" style={{
            background: isAnimating ? 'linear-gradient(135deg, #00d4ff, #8b5cf6)' : '#00d4ff'
          }} />
          <span>Current State: <strong>{stateLabel}</strong></span>
        </div>
        <div className="state-info">
          <div className="state-label">|0⟩ Probability</div>
          <div className="state-value" style={{ color: '#00d4ff' }}>{probabilities.prob0}%</div>
        </div>
        <div className="state-info">
          <div className="state-label">|1⟩ Probability</div>
          <div className="state-value" style={{ color: '#8b5cf6' }}>{probabilities.prob1}%</div>
        </div>
        <div className="state-info">
          <div className="state-label">Phase (φ)</div>
          <div className="state-value">{phase}°</div>
        </div>
      </div>

      {/* Quantum Gate Controls */}
      <div className="gate-controls">
        <div className="gate-controls-header">
          <span className="gate-icon">⚛️</span>
          Quantum Gates
        </div>
        <div className="gate-buttons">
          <QuantumGateButton 
            onClick={applyHadamardGate} 
            variant="primary"
          >
            Apply H Gate
          </QuantumGateButton>
          
          <QuantumGateButton 
            onClick={applyXGate} 
            variant="secondary"
          >
            Apply X Gate
          </QuantumGateButton>
          
          <QuantumGateButton 
            onClick={applyZGate} 
            variant="secondary"
          >
            Apply Z Gate
          </QuantumGateButton>
          
          <QuantumGateButton 
            onClick={resetState} 
            variant="reset"
          >
            Reset State
          </QuantumGateButton>
        </div>
      </div>

      {/* Manual Angle Controls */}
      <div className="angle-controls">
        <div className="glass-panel" style={{ padding: '16px', width: '180px' }}>
          <div className="state-label" style={{ marginBottom: '8px' }}>θ (Polar)</div>
          <input
            type="range"
            min="0"
            max={Math.PI}
            step="0.01"
            value={theta}
            onChange={handleThetaChange}
            style={{ width: '100%', accentColor: '#00d4ff' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
            {(theta * 180 / Math.PI).toFixed(0)}°
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', width: '180px' }}>
          <div className="state-label" style={{ marginBottom: '8px' }}>φ (Azimuthal)</div>
          <input
            type="range"
            min="0"
            max={2 * Math.PI}
            step="0.01"
            value={phi}
            onChange={handlePhiChange}
            style={{ width: '100%', accentColor: '#8b5cf6' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
            {(phi * 180 / Math.PI).toFixed(0)}°
          </div>
        </div>
      </div>
    </div>
  )
}

export default QubitViewer
