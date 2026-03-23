import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * HomePage Component
 * Landing page for Qubiq platform with feature cards and quick actions
 */
const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: '◈',
      title: 'Interactive Qubits',
      description: 'Visualize quantum states on an interactive Bloch sphere with real-time controls.',
      path: '/qubits',
      color: '#00d4ff'
    },
    {
      icon: '⊞',
      title: 'Quantum Circuits',
      description: 'Build and simulate quantum circuits with drag-and-drop gate operations.',
      path: '/circuits',
      color: '#8b5cf6'
    },
    {
      icon: '⚡',
      title: 'Error Playground',
      description: 'Explore quantum errors and decoherence effects in a controlled environment.',
      path: '/error-playground',
      color: '#f59e0b'
    },
    {
      icon: '⚗',
      title: 'Quantum Lab',
      description: 'Run experiments and test quantum algorithms in a virtual laboratory.',
      path: '/quantum-lab',
      color: '#10b981'
    }
  ]

  return (
    <div className="content-area">
      <div className="page-header">
        <h1 className="page-title">Welcome to Qubiq</h1>
        <p className="page-subtitle">
          Your interactive gateway to quantum computing
        </p>
      </div>

      {/* Hero Section */}
      <div className="glass-panel" style={{ 
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 212, 255, 0.1))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{ 
            fontSize: '80px',
            textShadow: '0 0 40px rgba(0, 212, 255, 0.8)'
          }}>ψ</div>
          <div>
            <h2 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              marginBottom: '12px',
              background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Start Your Quantum Journey
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Explore the fascinating world of quantum computing through interactive visualizations, 
              hands-on experiments, and AI-powered guidance. Perfect for beginners and enthusiasts alike.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {features.map((feature, index) => (
          <div
            key={index}
            className="glass-panel"
            onClick={() => navigate(feature.path)}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderColor: `${feature.color}33`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 8px 32px ${feature.color}22`
              e.currentTarget.style.borderColor = feature.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
            }}
          >
            <div style={{ 
              fontSize: '40px', 
              marginBottom: '16px',
              color: feature.color
            }}>
              {feature.icon}
            </div>
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              {feature.title}
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={{ 
        marginTop: '40px',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'Qubit States', value: '∞' },
          { label: 'Superposition', value: 'Active' },
          { label: 'Entanglement', value: 'Ready' },
          { label: 'AI Assistant', value: 'Online' }
        ].map((stat, i) => (
          <div 
            key={i}
            className="glass-panel"
            style={{ 
              flex: '1',
              minWidth: '150px',
              padding: '16px 24px',
              textAlign: 'center'
            }}
          >
            <div style={{ 
              fontSize: '28px', 
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent-primary)',
              marginBottom: '4px'
            }}>
              {stat.value}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomePage
