import "./DynamicResultsTable.scss";

import type {
  ExecutionColumn,
  ExecutionPagination,
  ExecutionRow,
} from "../types/report";

export interface DynamicResultsTableProps {
  columns: ExecutionColumn[];
  rows: ExecutionRow[];
  pagination: ExecutionPagination;
  onPageChange: (start: number) => void;
}

function formatValue(value: unknown, type: ExecutionColumn["dataType"]) {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "boolean") return value ? "Yes" : "No";
  if ((type === "integer" || type === "numeric") && typeof value === "number") {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }
  return String(value);
}

export function DynamicResultsTable({
  columns,
  rows,
  pagination,
  onPageChange,
}: DynamicResultsTableProps) {
  if (columns.length === 0) return <p>No result columns available.</p>;

  const start = pagination.pageNumber * pagination.pageSize;
  const end = Math.min(start + rows.length, pagination.numberOfRecords);
  const canGoPrevious = pagination.pageNumber > 0;
  const canGoNext = pagination.pageNumber + 1 < pagination.numberOfPages;

  return (
    <div className="dynamic-results">
      <div
        className="table-container"
        role="region"
        aria-label="Execution results table"
        tabIndex={0}
      >
        <table className="dynamic-results-table" aria-label="Execution results">
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column.id}>
                  {column.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column, columnIndex) => (
                  <td key={column.id}>
                    {formatValue(row.entries[columnIndex], column.dataType)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="dynamic-results-pagination" aria-label="Execution results pagination">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(Math.max(0, start - pagination.pageSize))}
        >
          Previous
        </button>
        <span role="status">
          {pagination.numberOfRecords === 0
            ? "No records"
            : `Showing ${start + 1}-${end} of ${pagination.numberOfRecords}`}
        </span>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(start + pagination.pageSize)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export const dynamicResultsTable = DynamicResultsTable;
export default DynamicResultsTable;
