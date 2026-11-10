import { afterEach, describe, expect, it } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "./client";
import { setupMockApi } from "./mockApi";
import { getReportFields, getReports } from "./reports";
import reports from "../data/reports.json";
import reportFields from "../data/reportFields.json";

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

  it("fetches a report's fields from GET /reports/:id/fields", async () => {
    expect(await getReportFields("2")).toEqual(reportFields[1].fields);
    expect(mock.history.get[0].url).toBe("/reports/2/fields");
  });

  it("returns 404 for the fields of an unknown report", async () => {
    await expect(getReportFields("missing")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("encodes the report id in the fields URL", async () => {
    await expect(getReportFields("a/b")).rejects.toMatchObject({
      response: { status: 404 },
    });
    expect(mock.history.get[0].url).toBe("/reports/a%2Fb/fields");
  });
});
