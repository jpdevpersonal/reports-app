import { isRecord, isReportField } from '../components/reportFieldRegistry'
import type { ReportDefinition } from '../types/reportDefinition'

export function parseReportDefinitions(value: unknown): ReportDefinition[] {
  if (!Array.isArray(value)) {
    throw new Error('Report definitions must be an array.')
  }

  const reportIds = new Set<string>()
  return value.map((report: unknown) => {
    if (!isRecord(report)
      || typeof report.id !== 'string' || report.id.trim() === ''
      || typeof report.title !== 'string' || report.title.trim() === ''
      || !Array.isArray(report.fields)) {
      throw new Error('Each report must have an ID, title and fields array.')
    }
    if (reportIds.has(report.id)) {
      throw new Error(`Duplicate report ID: ${report.id}`)
    }
    reportIds.add(report.id)

    const fieldIds = new Set<string>()
    const fields = report.fields.map((field: unknown) => {
      if (!isReportField(field)) {
        throw new Error(`Invalid or unsupported field definition in report ${report.id}.`)
      }
      if (fieldIds.has(field.id)) {
        throw new Error(`Duplicate field ID in report ${report.id}: ${field.id}`)
      }
      fieldIds.add(field.id)
      return field
    })
    return { id: report.id, title: report.title, fields }
  })
}
