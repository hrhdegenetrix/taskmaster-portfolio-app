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
    // Check localStorage first, then system preference
    try {
      const stored = localStorage.getItem('taskmaster-theme')
      if (stored) {
        return stored === 'dark'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (error) {
      // Fallback to light mode if localStorage is not available
      console.warn('Failed to access localStorage for theme, defaulting to light mode')
      return false
    }
  })

  useEffect(() => {
    // Update document class and localStorage immediately
    const root = window.document.documentElement
    try {
      if (isDark) {
        root.classList.add('dark')
        localStorage.setItem('taskmaster-theme', 'dark')
      } else {
        root.classList.remove('dark')
        localStorage.setItem('taskmaster-theme', 'light')
      }
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }, [isDark])

  // Apply theme immediately on mount to prevent flash
  useEffect(() => {
    const root = window.document.documentElement
    const stored = localStorage.getItem('taskmaster-theme')
    if (stored === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem('taskmaster-theme')
      if (!stored) {
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const setTheme = (theme) => {
    setIsDark(theme === 'dark')
  }

  const value = {
    isDark,
    theme: isDark ? 'dark' : 'light',
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
} 