import React from 'react'
import { NavLink } from 'react-router-dom'

// Navigation items configuration
const navItems = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/qubits', label: 'Qubits', icon: '◈' },
  { path: '/circuits', label: 'Circuits', icon: '⊞' },
  { path: '/error-playground', label: 'Error Playground', icon: '⚡' },
  { path: '/quantum-lab', label: 'Quantum Lab', icon: '⚗' }
]

/**
 * Sidebar Component
 * Provides navigation between different sections of the Qubiq platform
 * Features glassmorphism design with animated hover effects
 */
const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-icon">ψ</div>
        <span className="logo-text">QUBIQ</span>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid var(--glass-border)',
        marginTop: 'auto'
      }}>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          Quantum Computing<br />Learning Platform
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
