import { afterEach, describe, expect, it } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "./client";
import { setupMockApi } from "./mockApi";
import { getReports } from "./reports";
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
});
