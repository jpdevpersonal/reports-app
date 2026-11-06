import { Route, Routes } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import ReportsListPage from './pages/ReportsListPage'
import ReportPage from './pages/ReportPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<ReportsListPage />} />
        <Route path="/reports/:id" element={<ReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
