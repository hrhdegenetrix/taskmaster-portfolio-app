import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // On app startup, always use Settings preference (ignore session overrides)
    try {
      // Clear any session overrides from previous sessions
      localStorage.removeItem('taskmaster-theme-session')
      
      // Check for Settings preference (user's chosen default)
      const settingsPreference = localStorage.getItem('taskmaster-theme-preference')
      if (settingsPreference) {
        return settingsPreference === 'dark'
      }
      
      // Fall back to system preference if no Settings preference is set
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (error) {
      // Fallback to light mode if localStorage is not available
      console.warn('Failed to access localStorage for theme, defaulting to light mode')
      return false
    }
  })

  useEffect(() => {
    // Update document class immediately
    const root = window.document.documentElement
    try {
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error)
    }
  }, [isDark])

  // Apply theme immediately on mount to prevent flash
  useEffect(() => {
    const root = window.document.documentElement
    try {
      // Apply the current state immediately to prevent flash
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } catch (error) {
      console.warn('Failed to apply initial theme:', error)
    }
  }, [])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only auto-switch if user hasn't set a preference in Settings
      const settingsPreference = localStorage.getItem('taskmaster-theme-preference')
      if (!settingsPreference) {
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Temporary toggle for sidebar/top bar (session only, not persisted)
  const toggleTheme = () => {
    setIsDark(!isDark)
    // This is purely temporary for current session - not saved to localStorage
    // On app refresh, it will revert to Settings preference
  }

  // Set theme preference from Settings (permanent default)
  const setThemePreference = (theme) => {
    const newValue = theme === 'dark'
    setIsDark(newValue)
    try {
      // Save as permanent preference - this will be the default on app startup
      localStorage.setItem('taskmaster-theme-preference', theme)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  const setTheme = (theme) => {
    setIsDark(theme === 'dark')
  }

  const value = {
    isDark,
    theme: isDark ? 'dark' : 'light',
    toggleTheme, // Temporary toggle for sidebar/top bar
    setTheme,
    setThemePreference, // Permanent preference for Settings
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
} 