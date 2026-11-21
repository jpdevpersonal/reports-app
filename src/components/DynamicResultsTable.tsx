import "./DynamicResultsTable.scss";

import type { ExecutionColumn } from "../types/report";

export interface DynamicResultsTableProps {
  columns: ExecutionColumn[];
  rows: Record<string, unknown>[];
  start: number;
  pageSize: number;
  total: number;
  onPageChange: (start: number) => void;
}

function formatValue(value: unknown, type: ExecutionColumn["type"]) {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "number" && typeof value === "number") {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }
  return String(value);
}

export function DynamicResultsTable({
  columns,
  rows,
  start,
  pageSize,
  total,
  onPageChange,
}: DynamicResultsTableProps) {
  if (columns.length === 0) return <p>No result columns available.</p>;

  const end = Math.min(start + rows.length, total);
  const canGoPrevious = start > 0;
  const canGoNext = start + pageSize < total;

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
                <th scope="col" key={column.description}>
                  {column.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.description}>
                    {formatValue(row[column.description], column.type)}
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
          onClick={() => onPageChange(Math.max(0, start - pageSize))}
        >
          Previous
        </button>
        <span role="status">
          {total === 0 ? "No records" : `Showing ${start + 1}-${end} of ${total}`}
        </span>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(start + pageSize)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export const dynamicResultsTable = DynamicResultsTable;
export default DynamicResultsTable;
