import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  apiFetch,
  customersImportSampleCsvUrl,
  customersImportSampleXlsxUrl,
  customersImportUrl,
  getStaffToken,
} from "@/lib/api";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParsedRow {
  name: string;
  phone: string;
  tag?: string;
  valid: boolean;
  error?: string;
}

function normalizeE164(raw: string): { ok: boolean; phone: string } {
  const t = raw.trim().replace(/\s+/g, " ");
  const compact = t.replace(/\s/g, "");
  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replace(/\D/g, "");
    return digits.length >= 10 ? { ok: true, phone: `+${digits}` } : { ok: false, phone: raw };
  }
  const digits = compact.replace(/\D/g, "");
  if (digits.length === 10) return { ok: true, phone: `+91${digits}` };
  if (digits.length >= 11 && digits.startsWith("91") && digits.length <= 13) return { ok: true, phone: `+${digits}` };
  return { ok: false, phone: raw };
}

function mapTagToApi(raw: string): string | undefined {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    vip: "vip",
    frequent: "frequent",
    frequent_visitor: "frequent",
    regular: "neutral",
    neutral: "neutral",
    inactive: "inactive",
    first_time: "first_time",
    firsttime: "first_time",
    first_timer: "first_time",
  };
  const v = aliases[key];
  return v || undefined;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      q = !q;
    } else if ((c === "," && !q) || c === "\r") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function buildParsedRows(matrix: string[][]): ParsedRow[] {
  if (matrix.length < 2) return [];
  const header = matrix[0].map((h) => String(h || "").toLowerCase().replace(/\*/g, ""));
  const iName = header.findIndex((h) => h.includes("name"));
  const iPhone = header.findIndex((h) => h.includes("phone"));
  const iTag = header.findIndex((h) => h.includes("tag"));
  if (iName < 0 || iPhone < 0) {
    toast({ title: "File must include Name and Phone columns", variant: "destructive" });
    return [];
  }

  const rows: ParsedRow[] = [];
  const seen = new Set<string>();
  for (let li = 1; li < matrix.length; li++) {
    const cells = matrix[li] || [];
    const name = String(cells[iName] ?? "").trim();
    const phoneRaw = String(cells[iPhone] ?? "").trim();
    const tagRaw = iTag >= 0 ? String(cells[iTag] ?? "").trim() : "";
    const tagApi = mapTagToApi(tagRaw);
    const { ok, phone } = normalizeE164(phoneRaw);
    let error: string | undefined;
    if (!name) error = "Name required";
    else if (!ok) error = "Phone must be 10 digits or E.164 (+country…)";

    const dedupeKey = phone.replace(/\D/g, "");
    if (ok && dedupeKey && seen.has(dedupeKey)) error = "Duplicate in file";
    if (ok && dedupeKey) seen.add(dedupeKey);

    rows.push({
      name: name || "—",
      phone: ok ? phone : phoneRaw,
      ...(tagApi ? { tag: tagApi } : {}),
      valid: !error,
      error,
    });
  }
  return rows;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const matrix = lines.map((line) => parseCsvLine(line));
  return buildParsedRows(matrix);
}

function parseXlsx(buf: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: "array" });
  const name = wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  const matrix = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown as (string | number | undefined)[][];
  const asStrings = matrix.map((row) =>
    (row || []).map((c) => (c === undefined || c === null ? "" : String(c))),
  );
  return buildParsedRows(asStrings);
}

const ImportCustomers = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importSummary, setImportSummary] = useState<{ created: number; updated: number; errors: unknown[] } | null>(null);

  const downloadSample = useCallback(
    async (kind: "csv" | "xlsx") => {
      const path = kind === "csv" ? customersImportSampleCsvUrl(slug) : customersImportSampleXlsxUrl(slug);
      const headers = new Headers();
      const tok = getStaffToken();
      if (tok) headers.set("Authorization", `Token ${tok}`);
      try {
        const r = await fetch(path, { credentials: "include", headers });
        if (!r.ok) {
          toast({ title: "Download failed", description: await r.text(), variant: "destructive" });
          return;
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = kind === "csv" ? "customer-import-sample.csv" : "customer-import-sample.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Sample downloaded" });
      } catch (e) {
        toast({
          title: "Download failed",
          description: e instanceof Error ? e.message : "Network error",
          variant: "destructive",
        });
      }
    },
    [slug],
  );

  const readFile = useCallback((file: File) => {
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        setParsed(parseCsv(text));
      };
      reader.readAsText(file);
      return;
    }
    if (lower.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = () => {
        const buf = reader.result;
        if (buf instanceof ArrayBuffer) setParsed(parseXlsx(buf));
        else setParsed(null);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    toast({ title: "Please upload a .csv or .xlsx file", variant: "destructive" });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const validCount = parsed?.filter((r) => r.valid).length || 0;
  const invalidCount = parsed?.filter((r) => !r.valid).length || 0;

  const handleImport = async () => {
    if (!parsed || validCount === 0) return;
    setImporting(true);
    try {
      const customers = parsed.filter((r) => r.valid).map((r) => ({
        name: r.name,
        phone: r.phone,
        ...(r.tag ? { tag: r.tag } : {}),
      }));
      const res = await apiFetch<{ created: number; updated: number; errors: unknown[] }>(customersImportUrl(slug), {
        method: "POST",
        body: JSON.stringify({ customers }),
      });
      setImported(true);
      setImportSummary(res);
      toast({
        title: "Import complete",
        description: `${res.created} created, ${res.updated} updated${res.errors.length ? `, ${res.errors.length} row errors` : ""}`,
      });
    } catch (e) {
      toast({
        title: "Import failed",
        description: e instanceof Error ? e.message : "Check staff token and file format",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setParsed(null);
    setFileName(null);
    setImported(false);
    setImportSummary(null);
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Import Customers</h1>
        <p className="text-muted-foreground text-sm">Bulk upload customers to {selectedOutlet.name}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold text-foreground text-sm">Required Format</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadSample("csv")}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <Download size={14} />
              Sample CSV
            </button>
            <button
              type="button"
              onClick={() => void downloadSample("xlsx")}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <Download size={14} />
              Sample Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                {["Name*", "Phone*", "Tag (optional)"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs border-r border-border last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-4 py-2 text-foreground">Rahul Sharma</td>
                <td className="px-4 py-2 text-foreground">+919876543210</td>
                <td className="px-4 py-2 text-muted-foreground">vip</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2 text-foreground">Sample User</td>
                <td className="px-4 py-2 text-foreground">+919876543211</td>
                <td className="px-4 py-2 text-muted-foreground">(empty → Neutral)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          * Required. Phone: E.164 or 10-digit India. Tags: vip, frequent, first_time / first timer, neutral, inactive. Omit tag for Neutral.
        </p>
      </div>

      {!parsed && !imported && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`bg-card border-2 border-dashed rounded-xl p-12 text-center transition-colors animate-fade-in ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">Drag & drop CSV or Excel here</p>
          <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
          <label className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-foreground/90 transition-colors">
            <FileSpreadsheet size={16} />
            Choose File
            <input type="file" accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      )}

      {parsed && !imported && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-foreground font-medium text-sm">{fileName}</p>
                  <p className="text-muted-foreground text-xs">{parsed.length} rows detected</p>
                </div>
              </div>
              <button type="button" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-success/5 border border-success/20 rounded-lg p-3 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-success" />
                <div>
                  <p className="text-foreground font-bold text-lg">{validCount.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">Valid customers</p>
                </div>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle size={20} className="text-destructive" />
                <div>
                  <p className="text-foreground font-bold text-lg">{invalidCount}</p>
                  <p className="text-muted-foreground text-xs">Invalid rows</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    {["", "Name", "Phone", "Tag", "Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((row, i) => (
                    <tr key={i} className={`border-t border-border ${!row.valid ? "bg-destructive/5" : ""}`}>
                      <td className="px-3 py-2">
                        {row.valid ? <CheckCircle2 size={14} className="text-success" /> : <AlertCircle size={14} className="text-destructive" />}
                      </td>
                      <td className="px-3 py-2 text-foreground">{row.name}</td>
                      <td className="px-3 py-2 text-foreground">{row.phone}</td>
                      <td className="px-3 py-2">
                        {row.tag && <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{row.tag}</span>}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.valid ? <span className="text-success">Ready</span> : <span className="text-destructive">{row.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 20 && <p className="text-xs text-muted-foreground mt-2 text-center">Showing 20 of {parsed.length} rows</p>}
          </div>

          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || validCount === 0}
            className="w-full bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${validCount.toLocaleString()} Customers`}
          </button>
        </div>
      )}

      {imported && importSummary && (
        <div className="bg-card border border-border rounded-xl p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Import Complete</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {importSummary.created} created, {importSummary.updated} updated for {selectedOutlet.name}
          </p>
          {importSummary.errors.length > 0 && (
            <p className="text-xs text-destructive mb-4">{importSummary.errors.length} rows rejected by the server (see API errors).</p>
          )}
          <button type="button" onClick={handleReset} className="text-sm text-primary hover:underline">
            Import another file
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportCustomers;
