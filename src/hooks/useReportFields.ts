import { useEffect, useState } from "react";
import axios from "axios";
import { getReportFields } from "../api/reports";
import type { ReportField } from "../types/reportField";
import type { ReportsState } from "./useReportsData";

// Loads the fields for one report. If reportId changes, the parent should give
// the component using this hook a new `key` so that its state starts fresh.
export default function useReportFields(
  reportId: string,
): ReportsState<ReportField[]> {
  const [state, setState] = useState<ReportsState<ReportField[]>>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    getReportFields(reportId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: "" });
        }
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error) || controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: "Unable to load report fields. Please try again later.",
        });
      });

    return () => controller.abort();
  }, [reportId]);

  return state;
}
