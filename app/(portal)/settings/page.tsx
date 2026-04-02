"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
  Unlink,
  Key,
  Lock,
  Brain,
  Scroll,
  UserPlus,
  LogIn,
  Globe,
  ExternalLink,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConnState = "unknown" | "checking" | "connected" | "disconnected" | "error";

interface StatusPayload {
  allcodex: { ok: boolean; configured: boolean; url: string | null; version?: string; error?: string };
  allknower: { ok: boolean; configured: boolean; url: string | null; error?: string };
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ state, version }: { state: ConnState; version?: string }) {
  if (state === "connected")
    return (
      <Badge className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle2 className="h-3 w-3" />
        Connected{version ? ` · v${version}` : ""}
      </Badge>
    );
  if (state === "checking")
    return (
      <Badge className="gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking…
      </Badge>
    );
  if (state === "error")
    return (
      <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      Disconnected
    </Badge>
  );
}

// ── AllCodex card ──────────────────────────────────────────────────────────────

function AllCodexCard({ initialStatus }: { initialStatus?: StatusPayload["allcodex"] }) {
  const [state, setState] = useState<ConnState>(
    initialStatus?.ok ? "connected" : initialStatus?.configured ? "error" : "disconnected"
  );
  const [version, setVersion] = useState(initialStatus?.version);
  const [url, setUrl] = useState(initialStatus?.url ?? "http://localhost:8080");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isConnected = state === "connected";

  async function handleConnectToken() {
    if (!url || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allcodex: { url, token } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      // probe
      const status = await fetch("/api/config/status").then((r) => r.json());
      if (status.allcodex.ok) {
        setState("connected");
        setVersion(status.allcodex.version);
      } else {
        setState("error");
        setError(status.allcodex.error ?? "Could not reach AllCodex");
      }
    } catch (e) {
      setState("error");
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginPassword() {
    if (!url || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/allcodex-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("connected");
      setPassword("");
      // refresh version from status
      const status = await fetch("/api/config/status").then((r) => r.json());
      setVersion(status.allcodex.version);
    } catch (e) {
      setState("error");
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    await fetch("/api/config/disconnect?service=allcodex", { method: "DELETE" });
    setState("disconnected");
    setVersion(undefined);
    setToken("");
    setPassword("");
    setError(null);
    setLoading(false);
  }

  return (
    <Card className="relative border-border/60 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Scroll className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle style={{ fontFamily: "var(--font-cinzel)" }}>AllCodex</CardTitle>
              <CardDescription>Trilium notes — ETAPI</CardDescription>
            </div>
          </div>
          <StatusBadge state={state} version={version} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="allcodex-url">Service URL</Label>
          <Input
            id="allcodex-url"
            type="url"
            placeholder="http://localhost:8080"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isConnected || loading}
          />
        </div>

        {!isConnected && (
          <Tabs defaultValue="token" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token">
                <Key className="h-3.5 w-3.5 mr-1.5" /> ETAPI Token
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="h-3.5 w-3.5 mr-1.5" /> Password Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="token" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="allcodex-token">ETAPI Token</Label>
                <Input
                  id="allcodex-token"
                  type="password"
                  placeholder="Trilium → Settings → ETAPI"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleConnectToken}
                disabled={loading || !url || !token}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Connect
              </Button>
            </TabsContent>

            <TabsContent value="password" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="allcodex-password">Trilium Password</Label>
                <Input
                  id="allcodex-password"
                  type="password"
                  placeholder="Your Trilium login password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The portal will call Trilium&apos;s login endpoint to obtain an ETAPI token automatically.
              </p>
              <Button
                className="w-full gap-2"
                onClick={handleLoginPassword}
                disabled={loading || !url || !password}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Login &amp; Connect
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {isConnected && (
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
            Disconnect
          </Button>
        )}

        {error && (
          <p className="text-xs text-red-400 rounded-md bg-red-500/10 border border-red-500/20 p-2">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── AllKnower card ─────────────────────────────────────────────────────────────

type AkMode = "idle" | "login" | "register";

function AllKnowerCard({ initialStatus }: { initialStatus?: StatusPayload["allknower"] }) {
  const [state, setState] = useState<ConnState>(
    initialStatus?.ok ? "connected" : initialStatus?.configured ? "error" : "disconnected"
  );
  const [url, setUrl] = useState(initialStatus?.url ?? "http://localhost:3001");
  const [mode, setMode] = useState<AkMode>("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isConnected = state === "connected";

  function resetForm() {
    setEmail("");
    setName("");
    setPassword("");
    setError(null);
  }

  function switchMode(next: AkMode) {
    resetForm();
    setMode(next);
  }

  async function handleLogin() {
    if (!url || !email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/allknower-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("connected");
      resetForm();
      setMode("idle");
    } catch (e) {
      setState("error");
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!url || !email || !name || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/allknower-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("connected");
      resetForm();
      setMode("idle");
    } catch (e) {
      setState("error");
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    await fetch("/api/config/disconnect?service=allknower", { method: "DELETE" });
    setState("disconnected");
    resetForm();
    setMode("idle");
    setLoading(false);
  }

  return (
    <Card className="relative border-border/60 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/30 border border-accent-foreground/10">
              <Brain className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle style={{ fontFamily: "var(--font-cinzel)" }}>AllKnower</CardTitle>
              <CardDescription>AI knowledge service</CardDescription>
            </div>
          </div>
          <StatusBadge state={state} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="allknower-url">Service URL</Label>
          <Input
            id="allknower-url"
            type="url"
            placeholder="http://localhost:3001"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isConnected || loading}
          />
        </div>

        {!isConnected && mode === "idle" && (
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => switchMode("login")}
              disabled={!url}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => switchMode("register")}
              disabled={!url}
            >
              <UserPlus className="h-4 w-4" />
              Register
            </Button>
          </div>
        )}

        {!isConnected && mode === "login" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ak-login-email">Email</Label>
              <Input
                id="ak-login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ak-login-password">Password</Label>
              <Input
                id="ak-login-password"
                type="password"
                placeholder="Your AllKnower password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleLogin}
                disabled={loading || !url || !email || !password}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Login
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => switchMode("idle")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isConnected && mode === "register" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ak-reg-name">Name</Label>
              <Input
                id="ak-reg-name"
                type="text"
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ak-reg-email">Email</Label>
              <Input
                id="ak-reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ak-reg-password">Password</Label>
              <Input
                id="ak-reg-password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleRegister}
                disabled={loading || !url || !email || !name || !password}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Register
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => switchMode("idle")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isConnected && (
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
            Disconnect
          </Button>
        )}

        {error && (
          <p className="text-xs text-red-400 rounded-md bg-red-500/10 border border-red-500/20 p-2">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Share Config card ─────────────────────────────────────────────────────────

function ShareConfigCard() {
  const [noteId, setNoteId] = useState("");
  const [current, setCurrent] = useState<{ noteId: string; title: string; alias: string | null; url: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/share")
      .then((r) => r.json())
      .then((d) => {
        if (d.configured) setCurrent(d);
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!noteId.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/share", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: noteId.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      // Refresh current
      const updated = await fetch("/api/share").then((r) => r.json());
      if (updated.configured) setCurrent(updated);
      setNoteId("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="relative border-border/60 overflow-hidden col-span-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-border/40">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle style={{ fontFamily: "var(--font-cinzel)" }}>Share Configuration</CardTitle>
            <CardDescription>Configure which note is the public share root (gets #shareRoot label).</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current share root */}
        {current && (
          <div className="rounded-md border border-border/40 bg-muted/20 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Current share root</p>
            <p className="text-sm font-medium">{current.title}</p>
            <p className="text-xs font-mono text-muted-foreground">{current.noteId}</p>
            {current.url && (
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                {current.url}
              </a>
            )}
          </div>
        )}

        {/* Set new share root */}
        <div className="space-y-1.5">
          <Label htmlFor="share-root-id">Set Share Root Note ID</Label>
          <div className="flex gap-2">
            <Input
              id="share-root-id"
              placeholder="Enter a note ID (e.g. abc123def456)"
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
              className="font-mono text-sm"
              disabled={saving}
            />
            <Button onClick={handleSave} disabled={saving || !noteId.trim()} className="shrink-0 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This note will be marked with <code className="bg-muted px-1 rounded">#shareRoot</code>. Navigate
            to <span className="font-mono">/share/</span> on your AllCodex instance to preview the share site.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-400 rounded-md bg-red-500/10 border border-red-500/20 p-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Portal Config card ────────────────────────────────────────────────────────

function PortalConfigCard() {
  const [loreRootId, setLoreRootId] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config/portal")
      .then((r) => r.json())
      .then((d) => setLoreRootId(d.loreRootNoteId ?? ""))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/config/portal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loreRootNoteId: loreRootId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative border-border/60 overflow-hidden col-span-full">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-transparent to-transparent pointer-events-none" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary border border-border/40">
            <Scroll className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <CardTitle style={{ fontFamily: "var(--font-cinzel)" }}>Portal Configuration</CardTitle>
            <CardDescription>Control how the Portal connects to your lore structure.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lore-root-id">Lore Root Note ID</Label>
          <div className="flex gap-2">
            <Input
              id="lore-root-id"
              placeholder="root (default) or a specific note ID"
              value={loreRootId}
              onChange={(e) => setLoreRootId(e.target.value)}
              className="font-mono text-sm"
              disabled={loading}
            />
            <Button onClick={handleSave} disabled={loading} className="shrink-0 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            New lore entries will be created under this note. Leave blank or set to{" "}
            <code className="bg-muted px-1 rounded">root</code> to use the AllCodex root.
          </p>
        </div>
        {error && (
          <p className="text-xs text-red-400 rounded-md bg-red-500/10 border border-red-500/20 p-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/config/status").then((r) => r.json());
      setStatus(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight text-primary"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          Service Connections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure AllCodex and AllKnower connections. Credentials are stored as secure cookies — no need
          to set environment variables.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 rounded-xl border border-border/60 bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <AllCodexCard initialStatus={status?.allcodex} />
          <AllKnowerCard initialStatus={status?.allknower} />
          <PortalConfigCard />
          <ShareConfigCard />
        </div>
      )}

      <div className="rounded-lg border border-border/40 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground/70 uppercase tracking-wider text-[10px]">Environment variables (optional override)</p>
        <p>
          If you prefer, you can still set <code className="bg-muted px-1 rounded">ALLCODEX_URL</code>,{" "}
          <code className="bg-muted px-1 rounded">ALLCODEX_ETAPI_TOKEN</code>,{" "}
          <code className="bg-muted px-1 rounded">ALLKNOWER_URL</code>, and{" "}
          <code className="bg-muted px-1 rounded">ALLKNOWER_BEARER_TOKEN</code> in{" "}
          <code className="bg-muted px-1 rounded">.env.local</code>. Cookie settings take priority when present.
        </p>
      </div>
    </div>
  );
}
