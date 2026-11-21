import { afterEach, describe, expect, it } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "./client";
import { setupMockApi } from "./mockApi";
import {
  EXECUTION_RESULTS_PAGE_SIZE,
  getExecutionResults,
  getReports,
} from "./reports";
import reports from "../data/reports.json";

let mock = setupMockApi(apiClient);

afterEach(() => {
  mock.restore();

  mock = setupMockApi(apiClient);
});

describe("reports API", () => {
  it("fetches all reports from GET /reports", async () => {
    expect(await getReports()).toEqual(reports);
    expect(mock.history.get[0].url).toBe("/reports");
  });

  it("propagates server errors", async () => {
    mock = new MockAdapter(apiClient);
    mock.onGet("/reports").reply(500);
    await expect(getReports()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("supports request cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      getReports({ signal: controller.signal }),
    ).rejects.toMatchObject({
      code: "ERR_CANCELED",
    });
  });

  it("fetches execution results with a start point and page size", async () => {
    const result = await getExecutionResults({
      reportId: "1",
      start: 5,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })

    expect(result.executionReport.Books).toBeDefined()
    expect(result.executionReport.total).toBeGreaterThan(0)
    expect(mock.history.get[0].url).toBe("/reports/1/results")
    expect(mock.history.get[0].params).toEqual({
      start: 5,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })
  })

  it("returns 20 records for each page and the remaining records for the final page", async () => {
    const firstPage = await getExecutionResults({
      reportId: "1",
      start: 0,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })
    const secondPage = await getExecutionResults({
      reportId: "1",
      start: 20,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })
    const finalPage = await getExecutionResults({
      reportId: "1",
      start: 40,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })

    expect(firstPage.executionReport.Books).toHaveLength(20)
    expect(secondPage.executionReport.Books).toHaveLength(20)
    expect(finalPage.executionReport.Books).toHaveLength(12)
    expect(finalPage.executionReport.total).toBe(52)
  })
});
