import { Routes, Route, useLocation } from 'react-router-dom'
import AppHeader from '../shared/components/AppHeader'
import DashboardPage from '../features/dashboard/pages/DashboardPage'
import MissionPage from '../features/missions/pages/MissionPage'
import ActiveMissionPage from '../features/missions/pages/ActiveMissionPage'
import HistoryPage from '../features/history/pages/HistoryPage'
import AboutPage from '../features/settings/pages/AboutPage'
import UserManagementPage from '../features/settings/pages/UserManagementPage'
import LoginPage from '../features/auth/pages/LoginPage'

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#1c222c] flex flex-col font-sans">
      {!isLoginPage && <AppHeader />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/missions" element={<MissionPage />} />
        <Route path="/missions/active" element={<ActiveMissionPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/user-management" element={<UserManagementPage />} />
      </Routes>
    </div>
  )
}

export default App
