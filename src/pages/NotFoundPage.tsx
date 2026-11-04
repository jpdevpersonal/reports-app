import { Link } from 'react-router-dom'
import PageLayout from '../layouts/PageLayout'

export default function NotFoundPage() {
  return (
    <PageLayout>
      <h1>Page not found</h1>
      <Link to="/">Back to reports</Link>
    </PageLayout>
  )
}
