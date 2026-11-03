import './ReportTable.scss'
import { Link } from 'react-router-dom'
import type { Report } from '../types/report'

interface ReportTableProps {
  reports: Report[]
}

export default function ReportTable({ reports }: ReportTableProps) {
  if (reports.length === 0) return <p>No reports available.</p>

  return (
    <div className="table-container" role="region" aria-label="Reports table" tabIndex={0}>
      <table className="report-table" aria-label="Reports Table">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Category</th>
            <th scope="col">Date</th>
            <th scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <th scope="row">
                <Link to={`/reports/${report.id}`}>{report.title}</Link>
              </th>
              <td>{report.category}</td>
              <td><time dateTime={report.date}>{report.date}</time></td>
              <td>{report.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
