import { useState, useCallback } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParsedRow {
  name: string;
  phone: string;
  tag?: string;
  email?: string;
  valid: boolean;
  error?: string;
}

const ImportCustomers = () => {
  const { selectedOutlet } = useRestaurant();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const simulateParse = useCallback((name: string) => {
    setFileName(name);
    // Simulate parsing a large file
    const mockRows: ParsedRow[] = [];
    const names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Ananya", "Diya", "Myra", "Sara", "Aadhya", "Isha", "Kiara", "Riya", "Pari", "Anika"];
    const tags = ["VIP", "Regular", "Influencer", "Frequent Visitor", ""];

    for (let i = 0; i < 50; i++) {
      const valid = i < 46;
      mockRows.push({
        name: `${names[i % names.length]} ${String.fromCharCode(65 + (i % 26))}`,
        phone: valid ? `+91 ${String(9000000000 + i * 1234)}` : (i % 2 === 0 ? "123" : "+91 98765 43210"),
        tag: tags[i % tags.length] || undefined,
        email: i % 3 === 0 ? `user${i}@email.com` : undefined,
        valid,
        error: !valid ? (i % 2 === 0 ? "Invalid phone number" : "Duplicate phone number") : undefined,
      });
    }
    setParsed(mockRows);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      simulateParse(file.name);
    } else {
      toast({ title: "Please upload a .csv or .xlsx file", variant: "destructive" });
    }
  }, [simulateParse]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateParse(file.name);
    }
  }, [simulateParse]);

  const validCount = parsed?.filter((r) => r.valid).length || 0;
  const invalidCount = parsed?.filter((r) => !r.valid).length || 0;

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImported(true);
      toast({ title: "Import complete", description: `${validCount} customers added to ${selectedOutlet.name}` });
    }, 2000);
  };

  const handleReset = () => {
    setParsed(null);
    setFileName(null);
    setImported(false);
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Import Customers</h1>
        <p className="text-muted-foreground text-sm">Bulk upload customers to {selectedOutlet.name}</p>
      </div>

      {/* Template info */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        <h2 className="font-semibold text-foreground text-sm mb-3">Required Format</h2>
        <div className="overflow-x-auto">
          <table className="text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                {["Name*", "Phone*", "Tag", "Email"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs border-r border-border last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-4 py-2 text-foreground">Rahul Sharma</td>
                <td className="px-4 py-2 text-foreground">9876543210</td>
                <td className="px-4 py-2 text-muted-foreground">VIP</td>
                <td className="px-4 py-2 text-muted-foreground">rahul@email.com</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2 text-foreground">Priya Nair</td>
                <td className="px-4 py-2 text-foreground">8765432109</td>
                <td className="px-4 py-2 text-muted-foreground">Regular</td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">* Required fields. Supports .csv and .xlsx files up to 50,000 rows.</p>
      </div>

      {!parsed && !imported && (
        /* Upload zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`bg-card border-2 border-dashed rounded-xl p-12 text-center transition-colors animate-fade-in ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">Drag & drop your file here</p>
          <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
          <label className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-foreground/90 transition-colors">
            <FileSpreadsheet size={16} />
            Choose File
            <input type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      )}

      {parsed && !imported && (
        /* Validation results */
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
              <button onClick={handleReset} className="text-muted-foreground hover:text-foreground">
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

            {/* Preview table */}
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    {["", "Name", "Phone", "Tag", "Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((row, i) => (
                    <tr key={i} className={`border-t border-border ${!row.valid ? "bg-destructive/5" : ""}`}>
                      <td className="px-3 py-2">
                        {row.valid
                          ? <CheckCircle2 size={14} className="text-success" />
                          : <AlertCircle size={14} className="text-destructive" />
                        }
                      </td>
                      <td className="px-3 py-2 text-foreground">{row.name}</td>
                      <td className="px-3 py-2 text-foreground">{row.phone}</td>
                      <td className="px-3 py-2">
                        {row.tag && <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{row.tag}</span>}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.valid
                          ? <span className="text-success">Ready</span>
                          : <span className="text-destructive">{row.error}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 20 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Showing 20 of {parsed.length} rows</p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || validCount === 0}
            className="w-full bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${validCount.toLocaleString()} Customers`}
          </button>
        </div>
      )}

      {imported && (
        <div className="bg-card border border-border rounded-xl p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Import Complete</h2>
          <p className="text-muted-foreground text-sm mb-4">{validCount.toLocaleString()} customers successfully added to {selectedOutlet.name}</p>
          <button onClick={handleReset} className="text-sm text-primary hover:underline">Import another file</button>
        </div>
      )}
    </div>
  );
};

export default ImportCustomers;
