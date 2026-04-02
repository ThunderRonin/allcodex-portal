"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileJson,
  X,
  ToggleLeft,
  ToggleRight,
  Map,
} from "lucide-react";

interface StatblockEntry {
  name: string;
  cr?: string | number;
  type?: string;
  size?: string;
  alignment?: string;
  ac?: number | string;
  hp?: number | string;
  [key: string]: unknown;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  detail: {
    created: Array<{ noteId: string; name: string }>;
    skipped: Array<{ name: string; reason: string }>;
    errors: Array<{ name: string; error: string }>;
  };
}

interface AzgaarPreview {
  mapName: string;
  stateCnt: number;
  burgCnt: number;
  religionCnt: number;
  cultureCnt: number;
  noteCnt: number;
}

interface AzgaarImportOptions {
  importStates: boolean;
  importBurgs: boolean;
  importReligions: boolean;
  importCultures: boolean;
  importNotes: boolean;
  skipDuplicates: boolean;
}

interface AzgaarBucket {
  created: Array<{ noteId: string; name: string }>;
  skipped: Array<{ name: string; reason: string }>;
  errors: Array<{ name: string; error: string }>;
}

interface AzgaarImportResult {
  mapName: string;
  totals: { created: number; skipped: number; errors: number };
  states: AzgaarBucket;
  burgs: AzgaarBucket;
  religions: AzgaarBucket;
  cultures: AzgaarBucket;
  notes: AzgaarBucket;
}

function EntryPreviewRow({
  entry,
  selected,
  onToggle,
}: {
  entry: StatblockEntry;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        selected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/40 border border-transparent"
      }`}
      onClick={onToggle}
    >
      <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        {selected ? (
          <ToggleRight className="h-4 w-4 text-primary" />
        ) : (
          <ToggleLeft className="h-4 w-4" />
        )}
      </button>
      <span className="flex-1 text-sm font-medium truncate">{entry.name}</span>
      {entry.cr !== undefined && (
        <Badge variant="outline" className="text-[10px] px-1.5 font-mono shrink-0">
          CR {entry.cr}
        </Badge>
      )}
      {entry.type && (
        <span className="text-xs text-muted-foreground capitalize shrink-0">{entry.type}</span>
      )}
    </div>
  );
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const azgaarFileInputRef = useRef<HTMLInputElement>(null);
  const [parsedEntries, setParsedEntries] = useState<StatblockEntry[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState("system-pack");

  // Azgaar state
  const [azgaarMapData, setAzgaarMapData] = useState<unknown>(null);
  const [azgaarPreview, setAzgaarPreview] = useState<AzgaarPreview | null>(null);
  const [azgaarParseError, setAzgaarParseError] = useState<string | null>(null);
  const [azgaarImportResult, setAzgaarImportResult] = useState<AzgaarImportResult | null>(null);
  const [azgaarOptions, setAzgaarOptions] = useState<AzgaarImportOptions>({
    importStates: true,
    importBurgs: true,
    importReligions: true,
    importCultures: true,
    importNotes: true,
    skipDuplicates: true,
  });

  const importMutation = useMutation({
    mutationFn: async (entries: StatblockEntry[]) => {
      const res = await fetch("/api/import/system-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: entries, skipDuplicates: true }),
      });
      if (!res.ok) throw new Error(`Import failed: ${res.statusText}`);
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => setImportResult(data),
  });

  const azgaarPreviewMutation = useMutation({
    mutationFn: async (mapData: unknown) => {
      const res = await fetch("/api/import/azgaar?action=preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapData }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<AzgaarPreview>;
    },
    onSuccess: (data) => setAzgaarPreview(data),
  });

  const azgaarImportMutation = useMutation({
    mutationFn: async ({ mapData, options }: { mapData: unknown; options: AzgaarImportOptions }) => {
      const res = await fetch("/api/import/azgaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapData, options }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<AzgaarImportResult>;
    },
    onSuccess: (data) => setAzgaarImportResult(data),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const json = JSON.parse(text);
        const entries: StatblockEntry[] = Array.isArray(json) ? json : json.monsters ?? json.entries ?? [];
        if (entries.length === 0) {
          setParseError("No entries found. Expected a JSON array or an object with a 'monsters' / 'entries' key.");
          return;
        }
        setParsedEntries(entries);
        setSelected(new Set(entries.map((_, i) => i)));
        setParseError(null);
        setImportResult(null);
      } catch {
        setParseError("Invalid JSON file — could not parse.");
      }
    };
    reader.readAsText(file);
  }

  function toggleAll() {
    if (selected.size === parsedEntries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(parsedEntries.map((_, i) => i)));
    }
  }

  function toggleOne(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function handleImport() {
    const entriesToImport = parsedEntries.filter((_, i) => selected.has(i));
    importMutation.mutate(entriesToImport);
  }

  function reset() {
    setParsedEntries([]);
    setSelected(new Set());
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAzgaarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const json = JSON.parse(text);
        setAzgaarMapData(json);
        setAzgaarParseError(null);
        setAzgaarPreview(null);
        setAzgaarImportResult(null);
        // Auto-preview on load
        azgaarPreviewMutation.mutate(json);
      } catch {
        setAzgaarParseError("Invalid JSON — could not parse the file.");
        setAzgaarMapData(null);
      }
    };
    reader.readAsText(file);
  }

  function resetAzgaar() {
    setAzgaarMapData(null);
    setAzgaarPreview(null);
    setAzgaarParseError(null);
    setAzgaarImportResult(null);
    if (azgaarFileInputRef.current) azgaarFileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 shrink-0">
        <Upload className="h-5 w-5 text-primary" />
        <h1 className="font-bold text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
          Import
        </h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="system-pack">System Pack (Statblocks)</TabsTrigger>
              <TabsTrigger value="azgaar">
                <Map className="h-3.5 w-3.5 mr-1.5" />
                Azgaar Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system-pack" className="mt-6 space-y-5">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-5 space-y-3">
                <h2 className="font-semibold text-sm">How it works</h2>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                  <li>Upload a JSON file containing an array of monster/creature objects</li>
                  <li>Compatible with SRD 5.1 and 5e API formats (expects <code className="bg-muted px-1 rounded">name</code>, <code className="bg-muted px-1 rounded">cr</code>, <code className="bg-muted px-1 rounded">type</code>, <code className="bg-muted px-1 rounded">ac</code>, <code className="bg-muted px-1 rounded">hp</code>)</li>
                  <li>Each entry becomes an AllCodex note with <code className="bg-muted px-1 rounded">#statblock</code> template and labels</li>
                  <li>Existing entries with the same name are skipped automatically</li>
                </ul>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload JSON file</label>
                <div
                  className="relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer p-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="h-8 w-8 text-muted-foreground/40" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to choose a file</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JSON only, any size</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {parseError && (
                  <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {parseError}
                  </p>
                )}
              </div>

              {/* Preview */}
              {parsedEntries.length > 0 && !importResult && (
                <Card className="border-border/50">
                  <CardHeader className="px-4 py-3 pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">
                        Preview — {parsedEntries.length} entries
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {selected.size} selected
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAll}>
                        {selected.size === parsedEntries.length ? "Deselect all" : "Select all"}
                      </Button>
                      <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-0 pb-3">
                    <ScrollArea className="max-h-72">
                      <div className="space-y-0.5">
                        {parsedEntries.map((entry, i) => (
                          <EntryPreviewRow
                            key={i}
                            entry={entry}
                            selected={selected.has(i)}
                            onToggle={() => toggleOne(i)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="pt-3">
                      <Button
                        onClick={handleImport}
                        disabled={selected.size === 0 || importMutation.isPending}
                        className="w-full"
                      >
                        {importMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing {selected.size} entries…
                          </>
                        ) : (
                          `Import ${selected.size} selected entr${selected.size === 1 ? "y" : "ies"}`
                        )}
                      </Button>
                      {importMutation.isError && (
                        <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Import failed — check AllKnower connection in Settings
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Result */}
              {importResult && (
                <Card className="border-emerald-900/40 bg-emerald-950/20">
                  <CardHeader className="px-4 py-3 pb-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <CardTitle className="text-sm text-emerald-300">Import complete</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-3 space-y-3">
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-300 font-semibold">{importResult.created} created</span>
                      {importResult.skipped > 0 && (
                        <span className="text-muted-foreground">{importResult.skipped} skipped</span>
                      )}
                      {importResult.errors > 0 && (
                        <span className="text-destructive">{importResult.errors} errors</span>
                      )}
                    </div>
                    {importResult.detail.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-destructive">Errors:</p>
                        {importResult.detail.errors.map((e, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            <span className="font-medium">{e.name}</span> — {e.error}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={reset}>
                        Import another file
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href="/statblocks">View Statblock Library →</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Azgaar Map Import ──────────────────────────────────────────── */}
            <TabsContent value="azgaar" className="mt-6 space-y-5">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-5 space-y-3">
                <h2 className="font-semibold text-sm">How it works</h2>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                  <li>Export your map from <strong>Azgaar Fantasy Map Generator</strong> as JSON (<code className="bg-muted px-1 rounded">Export → JSON</code>)</li>
                  <li>Upload it here — nations, cities, religions, cultures, and map notes become AllCodex lore notes</li>
                  <li>Choose which entity types to import and whether to skip duplicates</li>
                  <li>Each entity gets the correct template and searchable label attributes</li>
                </ul>
              </div>

              {/* File upload */}
              {!azgaarMapData && (
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Azgaar JSON export</label>
                  <div
                    className="relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer p-8"
                    onClick={() => azgaarFileInputRef.current?.click()}
                  >
                    <Map className="h-8 w-8 text-muted-foreground/40" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to choose a file</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JSON only — Azgaar FMG export</p>
                    </div>
                    <input
                      ref={azgaarFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleAzgaarFileChange}
                    />
                  </div>
                  {azgaarParseError && (
                    <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {azgaarParseError}
                    </p>
                  )}
                  {azgaarPreviewMutation.isError && (
                    <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {(azgaarPreviewMutation.error as Error)?.message ?? "Not a valid Azgaar FMG export"}
                    </p>
                  )}
                </div>
              )}

              {/* Preview + options */}
              {azgaarPreview && !azgaarImportResult && (
                <Card className="border-border/50">
                  <CardHeader className="px-4 py-3 pb-2">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm flex-1">{azgaarPreview.mapName}</CardTitle>
                      <button onClick={resetAzgaar} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-3 space-y-5">
                    {/* Entity counts summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      {[
                        { label: "Nations", count: azgaarPreview.stateCnt, key: "importStates" as keyof AzgaarImportOptions },
                        { label: "Cities", count: azgaarPreview.burgCnt, key: "importBurgs" as keyof AzgaarImportOptions },
                        { label: "Religions", count: azgaarPreview.religionCnt, key: "importReligions" as keyof AzgaarImportOptions },
                        { label: "Cultures", count: azgaarPreview.cultureCnt, key: "importCultures" as keyof AzgaarImportOptions },
                        { label: "Map Notes", count: azgaarPreview.noteCnt, key: "importNotes" as keyof AzgaarImportOptions },
                      ].map(({ label, count, key }) => (
                        <div
                          key={key}
                          className={`rounded-lg border p-3 cursor-pointer transition-all ${
                            azgaarOptions[key]
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/40 bg-muted/10 opacity-50"
                          }`}
                          onClick={() => setAzgaarOptions((prev) => ({ ...prev, [key]: !prev[key] }))}
                        >
                          <div className="text-xl font-bold text-primary">{count}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                          <div className="text-[10px] mt-1 text-muted-foreground">
                            {azgaarOptions[key] ? "✓ included" : "excluded"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Skip duplicates option */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="azgaar-skip-dupes"
                        checked={azgaarOptions.skipDuplicates}
                        onCheckedChange={(v) =>
                          setAzgaarOptions((prev) => ({ ...prev, skipDuplicates: !!v }))
                        }
                      />
                      <Label htmlFor="azgaar-skip-dupes" className="text-sm cursor-pointer">
                        Skip entries that already exist in AllCodex (matched by name)
                      </Label>
                    </div>

                    <Button
                      className="w-full"
                      disabled={azgaarImportMutation.isPending || !azgaarMapData}
                      onClick={() =>
                        azgaarMapData &&
                        azgaarImportMutation.mutate({ mapData: azgaarMapData, options: azgaarOptions })
                      }
                    >
                      {azgaarImportMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing map entities…
                        </>
                      ) : (
                        `Import from "${azgaarPreview.mapName}"`
                      )}
                    </Button>

                    {azgaarImportMutation.isError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {(azgaarImportMutation.error as Error)?.message ?? "Import failed"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Result */}
              {azgaarImportResult && (
                <Card className="border-emerald-900/40 bg-emerald-950/20">
                  <CardHeader className="px-4 py-3 pb-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <CardTitle className="text-sm text-emerald-300">
                        Import complete — {azgaarImportResult.mapName}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-3 space-y-3">
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-300 font-semibold">{azgaarImportResult.totals.created} created</span>
                      {azgaarImportResult.totals.skipped > 0 && (
                        <span className="text-muted-foreground">{azgaarImportResult.totals.skipped} skipped</span>
                      )}
                      {azgaarImportResult.totals.errors > 0 && (
                        <span className="text-destructive">{azgaarImportResult.totals.errors} errors</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      {(
                        [
                          ["Nations", azgaarImportResult.states],
                          ["Cities", azgaarImportResult.burgs],
                          ["Religions", azgaarImportResult.religions],
                          ["Cultures", azgaarImportResult.cultures],
                          ["Notes", azgaarImportResult.notes],
                        ] as [string, AzgaarBucket][]
                      ).map(([label, bucket]) => bucket.created.length + bucket.errors.length > 0 ? (
                        <div key={label} className="rounded border border-border/40 bg-muted/20 px-2 py-1.5">
                          <div className="font-semibold text-emerald-300">{bucket.created.length}</div>
                          <div className="text-muted-foreground">{label}</div>
                        </div>
                      ) : null)}
                    </div>
                    {/* Per-category errors */}
                    {(
                      [
                        azgaarImportResult.states,
                        azgaarImportResult.burgs,
                        azgaarImportResult.religions,
                        azgaarImportResult.cultures,
                        azgaarImportResult.notes,
                      ] as AzgaarBucket[]
                    ).flatMap((b) => b.errors).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-destructive">Errors:</p>
                        {(
                          [
                            azgaarImportResult.states,
                            azgaarImportResult.burgs,
                            azgaarImportResult.religions,
                            azgaarImportResult.cultures,
                            azgaarImportResult.notes,
                          ] as AzgaarBucket[]
                        ).flatMap((b) => b.errors).map((e, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            <span className="font-medium">{e.name}</span> — {e.error}
                          </p>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={resetAzgaar}>
                      Import another map
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
