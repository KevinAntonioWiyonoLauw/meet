"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Copy, Loader2, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";
import { dayTimes, weekday } from "@/lib/slots";
import type { Counts, MeetEvent, MeetResponse } from "@/lib/types";

// Literal classes so Tailwind v4 generates them (no dynamic alpha)
const GREEN = [
  "bg-emerald-500/0",
  "bg-emerald-500/10",
  "bg-emerald-500/20",
  "bg-emerald-500/30",
  "bg-emerald-500/45",
  "bg-emerald-500/60",
  "bg-emerald-500/75",
  "bg-emerald-500/90",
];

function idx(count: number, max: number): number {
  if (count === 0) return 0;
  return Math.max(1, Math.min(GREEN.length - 1, Math.round((count / max) * (GREEN.length - 1))));
}

const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
  "bg-pink-500", "bg-rose-500", "bg-[#94a3b8]",
];

const GREEN_HOVER = [
  "hover:bg-emerald-500/10",
  "hover:bg-emerald-500/20",
  "hover:bg-emerald-500/30",
  "hover:bg-emerald-500/45",
  "hover:bg-emerald-500/60",
  "hover:bg-emerald-500/75",
  "hover:bg-emerald-500/90",
];

function cellClass(count: number, max: number, me: boolean): string {
  const base = GREEN[idx(count, max)];
  if (me) return `${base} ring-2 ring-primary ring-offset-1 ring-offset-background cursor-pointer`;
  return count === 0
    ? "bg-muted/50 hover:bg-muted/80"
    : `${base} ${GREEN_HOVER[Math.min(GREEN_HOVER.length - 1, idx(count, max) + 1)]}`;
}

function personalCellClass(me: boolean): string {
  return me
    ? "bg-primary ring-2 ring-primary ring-offset-1 ring-offset-background cursor-pointer"
    : "bg-muted/50 hover:bg-muted/80 cursor-pointer";
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [ev, setEv] = useState<(MeetEvent & { responses: MeetResponse[]; counts: Counts; max: number }) | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [savedAs, setSavedAs] = useState<string | null>(null);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // drag state (refs to avoid re-render races)
  const dragModeRef = useRef<"add" | "remove" | null>(null);
  const mineRef = useRef<Set<string>>(new Set());
  const endDragRef = useRef<() => void>(() => {});

  useEffect(() => {
    mineRef.current = mine;
  }, [mine]);

  useEffect(() => {
    endDragRef.current = endDrag;
  });

  useEffect(() => {
    const up = () => endDragRef.current();
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(async (r) => (r.ok ? setEv(await r.json()) : setNotFound(true)))
      .catch(() => setNotFound(true));
  }, [id]);

  const save = useCallback(async (current: Set<string>) => {
    if (!savedAs) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: savedAs, slots: [...current] }),
      });
      if (!res.ok) return;
      setEv(await res.json());
    } finally {
      setBusy(false);
    }
  }, [id, savedAs]);

  function startDrag(slot: string, selected: boolean) {
    if (!savedAs || dragModeRef.current) return;
    const mode: "add" | "remove" = selected ? "remove" : "add";
    dragModeRef.current = mode;
    setMine((prev) => {
      const next = new Set(prev);
      if (mode === "add") next.add(slot);
      else next.delete(slot);
      mineRef.current = next;
      return next;
    });
  }

  function dragOver(slot: string) {
    if (!dragModeRef.current) return;
    setMine((prev) => {
      const next = new Set(prev);
      if (dragModeRef.current === "add") next.add(slot);
      else next.delete(slot);
      mineRef.current = next;
      return next;
    });
  }

  function endDrag() {
    if (!dragModeRef.current) return;
    dragModeRef.current = null;
    save(mineRef.current);
  }

  const times = useMemo(() => (ev ? dayTimes(ev.start, ev.end, ev.step) : []), [ev]);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full py-8 text-center">
          <CardTitle className="text-xl mb-2">Event not found</CardTitle>
          <CardDescription>The link is wrong, or the event was deleted.</CardDescription>
        </Card>
      </main>
    );
  }

  if (!ev) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const colors = COLORS.slice(0, ev.responses.length);

  // totals per time row across all days
  const rowTotals: Record<string, number> = {};
  for (const t of times) {
    let sum = 0;
    for (const d of ev.dates) sum += ev.counts[`${d}T${t}`] || 0;
    rowTotals[t] = sum;
  }
  const maxRowTotal = Math.max(1, ...Object.values(rowTotals));

  function register() {
    const n = name.trim();
    if (!n) {
      nameRef.current?.focus();
      return;
    }
    localStorage.setItem(`meet:${id}`, n);
    const existing = ev?.responses.find((r) => r.name === n);
    const selected = new Set(existing?.slots || []);
    mineRef.current = selected;
    setMine(selected);
    setSavedAs(n);
    setName("");
  }

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const you = savedAs ? {
    name: savedAs,
    slots: [...mine],
  } : null;

  const cols = `64px repeat(${ev.dates.length}, 1fr)`;
  const summaryCols = `64px repeat(${ev.dates.length}, 1fr)`;
  const namesFor = (slot: string) => ev.responses.filter((r) => r.slots.includes(slot)).map((r) => r.name);

  return (
    <main className="min-h-screen px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ev.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ev.responses.length} {ev.responses.length === 1 ? "person" : "people"} voted · link: meet.kevinio.my.id/meet/{ev.id}
            </p>
          </div>
          <Button variant="outline" onClick={share}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>

        {!savedAs && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap items-end gap-3">
              <div className="space-y-2 flex-1 min-w-[160px]">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" ref={nameRef} placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && register()} maxLength={50} />
              </div>
              <Button onClick={register} className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-1" /> Start voting
              </Button>
            </CardContent>
          </Card>
        )}

        {savedAs && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Voting as {savedAs} — drag across cells to select
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem(`meet:${id}`);
                setSavedAs(null);
                setMine(new Set());
              }}
            >
              Change name
            </Button>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your availability</CardTitle>
              <CardDescription>Click or drag cells. Hover cell to see who picked it.</CardDescription>
            </CardHeader>
            <CardContent className="select-none">
              <div className="overflow-x-auto"><div className="min-w-[520px]">
                <div className="grid" style={{ gridTemplateColumns: cols }}><div className="sticky left-0 z-20 bg-card" />{ev.dates.map((d) => <div key={d} className="text-center pb-2"><div className="text-xs text-muted-foreground">{weekday(d)}</div><div className="text-sm font-semibold">{d.slice(5)}</div></div>)}</div>
                <div className="space-y-0.5">{times.map((t) => <div key={t} className="grid" style={{ gridTemplateColumns: cols }}>
                  <div className="text-xs text-muted-foreground pr-2 text-right sticky left-0 z-10 bg-card flex items-center justify-end">{t}</div>
                  {ev.dates.map((d) => { const slot = `${d}T${t}`; const me = mine.has(slot); return <TooltipProvider key={slot}><Tooltip><TooltipTrigger draggable={false} className={`h-9 sm:h-7 rounded-sm transition-colors ${personalCellClass(me)} ${!savedAs ? "cursor-not-allowed opacity-70" : ""}`} aria-label={`${d} ${t}`} onPointerDown={(e) => { e.preventDefault(); if (savedAs && !busy) startDrag(slot, me); }} onPointerEnter={() => { if (savedAs && !busy) dragOver(slot); }}><span className="sr-only">{slot}</span></TooltipTrigger><TooltipContent side="top">{me ? "You selected this time" : "Available to select"}</TooltipContent></Tooltip></TooltipProvider>; })}
                </div>)}</div>
              </div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Group availability</CardTitle>
              <CardDescription>All selections combined. Darker cells mean better overlap.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto"><div className="min-w-[520px]">
                <div className="grid" style={{ gridTemplateColumns: summaryCols }}><div className="sticky left-0 z-20 bg-card" />{ev.dates.map((d) => <div key={d} className="text-center pb-2"><div className="text-xs text-muted-foreground">{weekday(d)}</div><div className="text-sm font-semibold">{d.slice(5)}</div></div>)}</div>
                <div className="space-y-0.5">{times.map((t) => <div key={t} className="grid" style={{ gridTemplateColumns: summaryCols }}>
                  <div className="text-xs text-muted-foreground pr-2 text-right sticky left-0 z-10 bg-card flex items-center justify-end">{t}</div>
                  {ev.dates.map((d) => { const slot = `${d}T${t}`; const count = ev.counts[slot] || 0; const names = namesFor(slot); return <TooltipProvider key={slot}><Tooltip><TooltipTrigger className={`h-9 sm:h-7 rounded-sm flex items-center justify-center text-xs font-bold tabular-nums ${cellClass(count, ev.max, false)}`}>{count || "·"}</TooltipTrigger><TooltipContent side="top">{names.length ? `${count}: ${names.join(", ")}` : "Nobody available"}</TooltipContent></Tooltip></TooltipProvider>; })}
                </div>)}</div>
              </div></div>
            </CardContent>
          </Card>
        </div>

        {ev.responses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Who&apos;s in</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {ev.responses.map((r, i) => (
                <Badge key={r.name} variant="outline" className="gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${colors[i] || "bg-foreground/40"}`} />
                  {r.name} · {r.slots.length} slots
                </Badge>
              ))}
              {you && (
                <Badge variant="secondary" className="gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  {you.name} · {you.slots.length} slots
                </Badge>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}