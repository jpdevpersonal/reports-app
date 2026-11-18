import { useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../layouts/PageLayout";
import CustomField from "../components/custom/CustomField";
import useReportFields from "../hooks/useReportFields";

export default function ReportPage() {
  const { id = "" } = useParams();

  return (
    <PageLayout>
      <h1>Report Name</h1>
      {/* The key gives each report a fresh form, so values never leak between reports. */}
      <ReportFields key={id} reportId={id} />
    </PageLayout>
  );
}

interface ReportFieldsProps {
  reportId: string;
}

function ReportFields({ reportId }: ReportFieldsProps) {
  const { data: fields, loading, error } = useReportFields(reportId);
  // The values the user has typed or selected, stored by field id.
  const [values, setValues] = useState<Record<string, string>>({});

  function handleChange(fieldId: string, value: string) {
    setValues((current) => ({ ...current, [fieldId]: value }));
  }

  if (loading) return <p role="status">Loading report fields...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!fields || fields.length === 0) return <p>This report has no fields.</p>;

  return (
    <div className="report-detail">
      {fields.map((field) => (
        <CustomField
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
