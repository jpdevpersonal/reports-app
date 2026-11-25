export interface Report {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  content: string;
}

export type ExecutionColumnDataType =
  | "string"
  | "integer"
  | "numeric"
  | "boolean"
  | "timestamp";

export interface ExecutionColumn {
  id: string;
  displayName: string;
  dataType: ExecutionColumnDataType;
}

export interface ExecutionRow {
  entries: unknown[];
}

export interface ExecutionPagination {
  pageNumber: number;
  pageSize: number;
  numberOfRecords: number;
  numberOfPages: number;
}

export interface ExecutionReportPayload {
  pagination: ExecutionPagination;
  columns: ExecutionColumn[];
  rows: ExecutionRow[];
}

export interface ReportExecutionRequest {
  inputParameters: Record<
    string,
    {
      displayName: string;
      type: string;
      value: unknown;
    }
  >;
}
