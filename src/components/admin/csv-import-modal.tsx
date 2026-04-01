"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csvImportRowSchema, type CsvImportRow } from "@/lib/validations/product";
import { importProductsCSV } from "@/app/actions/products";

interface ParsedRow {
  index: number;
  data: CsvImportRow | null;
  errors: string[];
  raw: Record<string, string>;
}

interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

export function CSVImportModal() {
  const [open, setOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setParsedRows([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows: ParsedRow[] = data.map((raw, i) => {
          const parsed = csvImportRowSchema.safeParse(raw);
          if (parsed.success) {
            return { index: i + 1, data: parsed.data, errors: [], raw };
          } else {
            return {
              index: i + 1,
              data: null,
              errors: parsed.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`),
              raw,
            };
          }
        });
        setParsedRows(rows);
      },
    });
  }

  function handleImport() {
    const validRows = parsedRows.filter((r) => r.data !== null).map((r) => r.data as CsvImportRow);
    startTransition(async () => {
      const res = await importProductsCSV(validRows);
      setResult(res);
    });
  }

  const validCount = parsedRows.filter((r) => r.data !== null).length;
  const invalidCount = parsedRows.filter((r) => r.data === null).length;
  const previewRows = parsedRows.slice(0, 5);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Import CSV
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold">Import Products via CSV</h2>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              {/* File upload */}
              {!result && (
                <div>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-500/5">
                    <Upload className="size-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {fileName ? fileName : "Click to upload CSV file"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Required columns: title, description, selling_price, cost_price, category,
                      image_urls, supplier_name, supplier_url
                    </span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFile}
                      className="sr-only"
                    />
                  </label>
                </div>
              )}

              {/* Validation summary */}
              {parsedRows.length > 0 && !result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                      {validCount} valid
                    </span>
                    {invalidCount > 0 && (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="size-4" />
                        {invalidCount} invalid
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {parsedRows.length} total rows
                    </span>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-x-auto rounded-lg border text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                          <th className="px-3 py-2 font-medium">#</th>
                          <th className="px-3 py-2 font-medium">Title</th>
                          <th className="px-3 py-2 font-medium">Category</th>
                          <th className="px-3 py-2 font-medium">Price</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewRows.map((row) => (
                          <tr
                            key={row.index}
                            className={row.data ? "" : "bg-destructive/5"}
                          >
                            <td className="px-3 py-2 text-muted-foreground">{row.index}</td>
                            <td className="px-3 py-2 max-w-[180px] truncate">
                              {row.raw.title ?? "—"}
                            </td>
                            <td className="px-3 py-2">{row.raw.category ?? "—"}</td>
                            <td className="px-3 py-2">{row.raw.selling_price ?? "—"}</td>
                            <td className="px-3 py-2">
                              {row.data ? (
                                <span className="text-emerald-600">Valid</span>
                              ) : (
                                <span
                                  className="text-destructive"
                                  title={row.errors.join("; ")}
                                >
                                  Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {parsedRows.length > 5 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-2 text-center text-muted-foreground"
                            >
                              + {parsedRows.length - 5} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Validation errors detail */}
                  {invalidCount > 0 && (
                    <div className="max-h-32 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                      {parsedRows
                        .filter((r) => r.errors.length > 0)
                        .map((r) => (
                          <p key={r.index} className="text-xs text-destructive">
                            Row {r.index}: {r.errors.join("; ")}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Import result */}
              {result && (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="size-5" />
                    <span className="font-semibold">{result.created} product{result.created !== 1 ? "s" : ""} imported successfully</span>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">
                        {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} failed:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-0.5">
                        {result.errors.map((e) => (
                          <p key={e.row} className="text-xs text-destructive">
                            Row {e.row}: {e.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
              {!result ? (
                <>
                  <Button variant="outline" onClick={handleClose} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0 || isPending}
                  >
                    {isPending
                      ? "Importing..."
                      : `Import ${validCount} product${validCount !== 1 ? "s" : ""}`}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={reset}>
                    Import Another File
                  </Button>
                  <Button onClick={handleClose}>Done</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
