import axios from "axios";
import { useEffect, useState } from "react";

import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import { getExecutionResults } from "../api/reports";
import type {
  ExecutionReportPayload,
  ReportExecutionRequest,
} from "../types/report";

interface ExecutionResultsState {
  data: ExecutionReportPayload | null;
  loading: boolean;
  error: string;
}

const EMPTY_EXECUTION_REQUEST: ReportExecutionRequest = {
  inputParameters: {},
};

export default function useExecutionResultsData(
  reportId: string | undefined,
  start: number,
  executionRequest = EMPTY_EXECUTION_REQUEST,
): ExecutionResultsState {
  const [state, setState] = useState<ExecutionResultsState>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!reportId) {
      setState({ data: null, loading: false, error: "" });
      return;
    }

    const controller = new AbortController();
    setState({ data: null, loading: true, error: "" });

    getExecutionResults({
      reportId,
      executionRequest,
      start,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({
            data: payload,
            loading: false,
            error: "",
          });
        }
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error) || controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: "Unable to load execution results. Please try again later.",
        });
      });

    return () => controller.abort();
  }, [executionRequest, reportId, start]);

  return state;
}
