import { useEffect, useState } from "react";
import axios from "axios";
import { getReports } from "../api/reports";
import type { Report } from "../types/report";

interface ReportsState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

export default function useReportsData(): ReportsState<Report[]> {
  const [state, setState] = useState<ReportsState<Report[]>>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    getReports({ signal: controller.signal })
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
          error: "Unable to load reports. Please try again later.",
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
