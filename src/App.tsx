import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/Toast'
import { DataProvider } from './store/DataContext'
import JournalPage from './pages/JournalPage'
import TodoPage from './pages/TodoPage'

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  )
}

function Shell() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the user navigates.
  useEffect(() => setNavOpen(false), [location.pathname, location.search])

  return (
    <div className={navOpen ? 'shell nav-open' : 'shell'}>
      <Sidebar />
      <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
      <div className="main">
        <TopBar onMenu={() => setNavOpen(true)} />
        <Routes>
          <Route path="/" element={<Navigate to="/journal" replace />} />
          <Route path="/journal/:entryId?" element={<JournalPage />} />
          <Route path="/todos/:view?" element={<TodoPage />} />
          <Route path="*" element={<Navigate to="/journal" replace />} />
        </Routes>
      </div>
    </div>
  )
}
