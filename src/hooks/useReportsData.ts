import { useEffect, useState } from "react";
import axios from "axios";
import { getReportById, getReports } from "../api/reports";
import type { Report } from "../types/report";

interface ReportsState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

export default function useReportsData(): ReportsState<Report[]>;
export default function useReportsData(id: string): ReportsState<Report>;
export default function useReportsData(
  id?: string,
): ReportsState<Report | Report[]> {
  const [state, setState] = useState<ReportsState<Report | Report[]>>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: "" });

    const request =
      id === undefined
        ? getReports({ signal: controller.signal })
        : getReportById(id, { signal: controller.signal });

    request
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
          error:
            axios.isAxiosError(error) && error.response?.status === 404
              ? "Report not found."
              : "Unable to load reports. Please try again later.",
        });
      });

    return () => controller.abort();
  }, [id]);

  return state;
}
