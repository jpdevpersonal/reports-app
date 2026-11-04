import PageLayout from "../layouts/PageLayout";
import ReportTable from "../components/ReportTable";
import useReportsData from "../hooks/useReportsData";

export default function ReportsListPage() {
  const { data: reports, loading, error } = useReportsData();

  return (
    <PageLayout>
      <h1>Reports</h1>
      {loading && <p role="status">Loading reports...</p>}
      {error && <p role="alert">{error}</p>}
      {reports && <ReportTable reports={reports} />}
    </PageLayout>
  );
}
