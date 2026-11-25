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
const executionRequest = {
  inputParameters: {
    "test-1": {
      displayName: "Test 1",
      type: "string",
      value: "books",
    },
    "test-2": {
      displayName: "Test 2",
      type: "string",
      value: "books",
    },
  },
};

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
      reportId: "books",
      executionRequest,
      start: 5,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })

    expect(result.rows).toBeDefined()
    expect(result.pagination.numberOfRecords).toBeGreaterThan(0)
    expect(mock.history.post[0].url).toBe("/reports/books/executions")
    expect(mock.history.post[0].params).toEqual({
      page: 0,
      size: EXECUTION_RESULTS_PAGE_SIZE,
    })
    expect(JSON.parse(mock.history.post[0].data)).toEqual(executionRequest)
  })

  it("returns 20 records for each page and the remaining records for the final page", async () => {
    const firstPage = await getExecutionResults({
      reportId: "1",
      executionRequest,
      start: 0,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })
    const secondPage = await getExecutionResults({
      reportId: "1",
      executionRequest,
      start: 20,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })
    const finalPage = await getExecutionResults({
      reportId: "1",
      executionRequest,
      start: 40,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
    })

    expect(firstPage.rows).toHaveLength(20)
    expect(secondPage.rows).toHaveLength(20)
    expect(finalPage.rows).toHaveLength(10)
    expect(finalPage.pagination).toEqual({
      pageNumber: 2,
      pageSize: 20,
      numberOfRecords: 50,
      numberOfPages: 3,
    })
  })
});
