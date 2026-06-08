/**
 * Utility to convert an array of objects to a CSV string and trigger a browser download.
 */

type Row = Record<string, unknown>;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, newline, or quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCSV(rows: Row[], columns: { key: string; header: string }[]): string {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((c) => {
      // Support dot-notation for nested fields: "exams.title"
      const keys = c.key.split(".");
      let val: unknown = row;
      for (const k of keys) {
        val = (val as Record<string, unknown>)?.[k];
      }
      return escapeCell(val);
    }).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(
  filename: string,
  rows: Row[],
  columns: { key: string; header: string }[]
): void {
  downloadCSV(filename, rowsToCSV(rows, columns));
}
