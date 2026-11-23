import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DynamicResultsTable from "./DynamicResultsTable";

const columns = [
  { id: "title", displayName: "Title", dataType: "string" as const },
  { id: "price", displayName: "Price", dataType: "numeric" as const },
  { id: "in_stock", displayName: "In Stock", dataType: "boolean" as const },
];

it("renders dynamic columns and formatted row values", () => {
  render(
    <DynamicResultsTable
      columns={columns}
      rows={[
        { entries: ["Atomic Habits", 16.99, true] },
        { entries: ["The Hobbit", 11.25, false] },
      ]}
      pagination={{
        pageNumber: 0,
        pageSize: 20,
        numberOfRecords: 12,
        numberOfPages: 1,
      }}
      onPageChange={vi.fn()}
    />,
  );

  const table = within(screen.getByRole("table", { name: "Execution results" }));
  expect(table.getAllByRole("columnheader").map((header) => header.textContent))
    .toEqual(["Title", "Price", "In Stock"]);
  expect(table.getByRole("cell", { name: "16.99" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "Yes" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "No" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

it("requests the next and previous start points", async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();

  const { rerender } = render(
    <DynamicResultsTable
      columns={columns}
      rows={[{ entries: ["Atomic Habits", 16.99, true] }]}
      pagination={{
        pageNumber: 0,
        pageSize: 20,
        numberOfRecords: 25,
        numberOfPages: 2,
      }}
      onPageChange={onPageChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenCalledWith(20);

  rerender(
    <DynamicResultsTable
      columns={columns}
      rows={[{ entries: ["The Hobbit", 11.25, true] }]}
      pagination={{
        pageNumber: 1,
        pageSize: 20,
        numberOfRecords: 25,
        numberOfPages: 2,
      }}
      onPageChange={onPageChange}
    />,
  );

  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).toHaveBeenCalledWith(0);
});
