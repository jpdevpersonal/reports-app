export interface Report {
  id: string
  title: string
  category: string
  date: string
  summary: string
  content: string
}

export type ExecutionColumnType = 'string' | 'number' | 'boolean'

export interface ExecutionColumn {
  description: string
  type: ExecutionColumnType
}

export interface ExecutionColumnSource {
  Description?: string
  description?: string
  Name?: string
  name?: string
  Type?: ExecutionColumnType
  type?: ExecutionColumnType
  Value?: unknown
  value?: unknown
}

export interface ExecutionBookSource {
  Columns?: ExecutionColumnSource[]
  columns?: ExecutionColumnSource[]
  [key: string]: unknown
}

export interface ExecutionReportPayload {
  executionReport?: {
    Books?: ExecutionBookSource[]
    books?: ExecutionBookSource[]
    Columns?: ExecutionColumn[]
    columns?: ExecutionColumn[]
    total?: number
    Total?: number
  }
}
