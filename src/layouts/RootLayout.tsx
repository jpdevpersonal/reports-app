import './RootLayout.scss'
import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="root-layout">
      <header className="root-layout__header">
        <span className="root-layout__brand">Reports App</span>
      </header>
      <main className="root-layout__main">
        <Outlet />
      </main>
      <footer className="root-layout__footer">&copy; Reports App</footer>
    </div>
  )
}
