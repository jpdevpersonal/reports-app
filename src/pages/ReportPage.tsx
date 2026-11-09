import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { reportFieldRegistry } from '../components/reportFieldRegistry'
import reportDefinitions from '../data/reportDefinitions.json'
import { parseReportDefinitions } from '../data/parseReportDefinitions'
import PageLayout from '../layouts/PageLayout'
import type { ReportDefinition } from '../types/reportDefinition'

function ReportFields({ report }: { report: ReportDefinition }) {
  const [values, setValues] = useState(() => new Map<string, string>())

  return (
    <>
      {report.fields.length === 0 && <p>No fields configured for this report.</p>}
      {report.fields.map((field) => (
        <div key={field.id}>
          {reportFieldRegistry[field.dataType].render(
            { ...field, value: values.get(field.id) ?? field.value },
            (value) => setValues((current) => new Map(current).set(field.id, value)),
          )}
        </div>
      ))}
    </>
  )
}

export default function ReportPage() {
  const { id } = useParams()
  let reports: ReportDefinition[]
  try {
    reports = parseReportDefinitions(reportDefinitions)
  } catch (error) {
    return (
      <PageLayout>
        <h1>Unable to load report</h1>
        <p role="alert">{error instanceof Error ? error.message : 'Invalid report definitions.'}</p>
        <Link to="/">Back to reports</Link>
      </PageLayout>
    )
  }
  const report = reports.find((definition) => definition.id === id)

  return (
    <PageLayout>
      <h1>{report ? report.title : 'Report not found'}</h1>
      {report && <ReportFields key={report.id} report={report} />}
      <Link to="/">Back to reports</Link>
    </PageLayout>
  )
}
