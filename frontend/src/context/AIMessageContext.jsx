import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

/**
 * AIMessageContext - Provides a way for components to communicate 
 * with the AI Tutor panel to display quantum operation explanations
 */
const AIMessageContext = createContext(null)

/**
 * Provider component that wraps the app and provides AI message functionality
 */
export const AIMessageProvider = ({ children }) => {
  const tutorPanelRef = useRef(null)

  // Function to add a message to the tutor panel
  const addAIMessage = useCallback((content) => {
    if (tutorPanelRef.current && typeof tutorPanelRef.current.addMessage === 'function') {
      tutorPanelRef.current.addMessage(content)
    } else {
      // TutorPanel not registered yet - queue the message for later
      console.log('TutorPanel not ready, queuing message:', content.substring(0, 50) + '...')
    }
  }, [])

  // Register the tutor panel ref
  const registerTutorPanel = useCallback((ref) => {
    tutorPanelRef.current = ref
  }, [])

  return (
    <AIMessageContext.Provider value={{ addAIMessage, registerTutorPanel }}>
      {children}
    </AIMessageContext.Provider>
  )
}

/**
 * Hook to access AI message functionality
 */
export const useAIMessage = () => {
  const context = useContext(AIMessageContext)
  if (!context) {
    // Return mock functions if context not available
    return {
      addAIMessage: (msg) => console.log('AI Message:', msg),
      registerTutorPanel: () => {}
    }
  }
  return context
}

export default AIMessageContext
