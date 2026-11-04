import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { getReports } from "../api/reports";
import reports from "../data/reports.json";
import useReportsData from "./useReportsData";

vi.mock("../api/reports", () => ({
  getReports: vi.fn(),
}));

const loadingState = { data: null, loading: true, error: "" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useReportsData", () => {
  it("loads reports and does not refetch on rerender", async () => {
    vi.mocked(getReports).mockResolvedValue(reports);
    const { result, rerender } = renderHook(() => useReportsData());

    expect(result.current).toEqual(loadingState);
    await waitFor(() => {
      expect(result.current).toEqual({
        data: reports,
        loading: false,
        error: "",
      });
    });

    rerender();
    expect(getReports).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(reports);
  });

  it("returns an empty list when no reports are available", async () => {
    vi.mocked(getReports).mockResolvedValue([]);
    const { result } = renderHook(() => useReportsData());

    await waitFor(() => {
      expect(result.current).toEqual({ data: [], loading: false, error: "" });
    });
  });

  it.each(["resolve", "reject"] as const)(
    "ignores an obsolete request that later %ss",
    async (outcome) => {
      let resolveRequest!: (data: typeof reports) => void;
      let rejectRequest!: (error: Error) => void;
      vi.mocked(getReports).mockReturnValueOnce(
        new Promise((resolve, reject) => {
          resolveRequest = resolve;
          rejectRequest = reject;
        }),
      );
      vi.mocked(getReports).mockResolvedValueOnce(reports);
      const { result } = renderHook(() => useReportsData(), {
        wrapper: StrictMode,
      });
      const signal = vi.mocked(getReports).mock.calls[0][0]?.signal;

      expect(signal?.aborted).toBe(true);
      await waitFor(() => expect(result.current.data).toEqual(reports));

      await act(async () => {
        if (outcome === "resolve") resolveRequest([]);
        else rejectRequest(new Error("Old request failed"));
      });
      expect(result.current).toEqual({
        data: reports,
        loading: false,
        error: "",
      });
    },
  );

  it.each([404, 500])("reports a list-fetch error for HTTP %s", async (status) => {
    const error = new AxiosError("Request failed");
    error.response = {
      status,
      statusText: "Request failed",
      data: null,
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    vi.mocked(getReports).mockRejectedValue(error);
    const { result } = renderHook(() => useReportsData());

    await waitFor(() => {
      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: "Unable to load reports. Please try again later.",
      });
    });
  });

  it("ignores cancellation errors", async () => {
    vi.mocked(getReports).mockRejectedValue(new CanceledError());
    const { result } = renderHook(() => useReportsData());

    await act(async () => {});
    expect(result.current).toEqual(loadingState);
  });

  it("cancels on unmount and loads successfully in Strict Mode", async () => {
    vi.mocked(getReports).mockResolvedValue(reports);
    const { result, unmount } = renderHook(() => useReportsData(), {
      wrapper: StrictMode,
    });

    await waitFor(() => expect(result.current.data).toEqual(reports));
    expect(getReports).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(getReports).mock.calls;
    expect(calls[0][0]?.signal?.aborted).toBe(true);
    expect(calls[1][0]?.signal?.aborted).toBe(false);
    unmount();
    expect(calls[1][0]?.signal?.aborted).toBe(true);
  });
});
