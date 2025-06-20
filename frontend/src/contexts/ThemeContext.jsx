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
  // Keep track of the permanent preference separate from current state
  const [permanentPreference, setPermanentPreference] = useState(() => {
    try {
      const settingsPreference = localStorage.getItem('taskmaster-theme-preference')
      if (settingsPreference) {
        return settingsPreference
      }
      // If no preference set, use system default
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch (error) {
      return 'light'
    }
  })

  const [isDark, setIsDark] = useState(() => {
    // On app startup, always use the permanent preference
    try {
      // Clear any session overrides from previous sessions
      localStorage.removeItem('taskmaster-theme-session')
      
      // Always start with permanent preference
      const settingsPreference = localStorage.getItem('taskmaster-theme-preference')
      if (settingsPreference) {
        console.log(`App starting with saved preference: ${settingsPreference}`)
        return settingsPreference === 'dark'
      }
      
      // Fall back to system preference if no Settings preference is set
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
      console.log(`App starting with system preference: ${systemPreference ? 'dark' : 'light'}`)
      return systemPreference
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
      if (!localStorage.getItem('taskmaster-theme-preference')) {
        const newTheme = e.matches ? 'dark' : 'light'
        setPermanentPreference(newTheme)
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Reset to permanent preference (called when needed)
  const resetToPreference = () => {
    setIsDark(permanentPreference === 'dark')
  }

  // Temporary toggle for sidebar/top bar (session only, not persisted)
  const toggleTheme = () => {
    setIsDark(!isDark)
    // This is purely temporary for current session - not saved anywhere
    // On app refresh, it will revert to permanent preference
    console.log(`Theme temporarily toggled to ${!isDark ? 'dark' : 'light'} (permanent preference remains: ${permanentPreference})`)
  }

  // Set theme preference from Settings (permanent default)
  const setThemePreference = (theme) => {
    const newValue = theme === 'dark'
    setPermanentPreference(theme) // Update permanent preference state
    setIsDark(newValue) // Apply immediately
    try {
      // Save as permanent preference - this will be the default on app startup
      localStorage.setItem('taskmaster-theme-preference', theme)
      console.log(`Permanent theme preference set to: ${theme}`)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  const setTheme = (theme) => {
    // This is just for temporary changes, doesn't affect permanent preference
    setIsDark(theme === 'dark')
  }

  const value = {
    isDark,
    theme: isDark ? 'dark' : 'light',
    permanentPreference, // The user's saved default preference
    toggleTheme, // Temporary toggle for sidebar/top bar (doesn't save)
    setTheme, // Temporary theme change (doesn't save)
    setThemePreference, // Permanent preference for Settings (saves to localStorage)
    resetToPreference, // Reset current theme to permanent preference
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
} 