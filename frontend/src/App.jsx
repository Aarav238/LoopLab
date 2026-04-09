import { Routes, Route } from 'react-router-dom'
import { ExperimentTrackerProvider } from './context/ExperimentTracker'
import ToastNotifications from './components/ToastNotifications'
import ProcessingBar from './components/ProcessingBar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ExperimentView from './pages/ExperimentView'

export default function App() {
  return (
    <ExperimentTrackerProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/experiment/:id" element={<ExperimentView />} />
      </Routes>
      <ToastNotifications />
      <ProcessingBar />
    </ExperimentTrackerProvider>
  )
}
