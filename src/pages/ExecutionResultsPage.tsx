
.import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DynamicResultsTable from "../components/DynamicResultsTable";
import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import useExecutionResultsData from "../hooks/useExecutionResultsData";
import useReportsData from "../hooks/useReportsData";
import PageLayout from "../layouts/PageLayout";

export default function ExecutionResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [start, setStart] = useState(0);
  const { data: reports } = useReportsData();
  const { data: result, loading, error } = useExecutionResultsData(id, start);
  const title = reports?.find((report) => report.id === id)?.title ?? "Report Name";

  useEffect(() => {
    setStart(0);
  }, [id]);

  return (
    <PageLayout>
      <h1>{title}</h1>
      {loading && <p role="status">Loading execution results...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && result && (
        <DynamicResultsTable
          columns={result.columns}
          rows={result.rows}
          start={start}
          pageSize={EXECUTION_RESULTS_PAGE_SIZE}
          total={result.total}
          onPageChange={setStart}
        />
      )}
    </PageLayout>
  );
}
