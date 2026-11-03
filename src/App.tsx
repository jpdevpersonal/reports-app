import { Route, Routes } from 'react-router-dom'
import ReportsListPage from './pages/ReportsListPage'
import ReportPage from './pages/ReportPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<ReportsListPage />} />
        <Route path="/reports/:id" element={<ReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}
