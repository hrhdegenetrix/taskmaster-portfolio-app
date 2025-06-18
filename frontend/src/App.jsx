import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { TaskProvider } from './contexts/TaskContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Categories from './pages/Categories'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </div>
        </Router>
      </TaskProvider>
    </ThemeProvider>
  )
}

export default App 