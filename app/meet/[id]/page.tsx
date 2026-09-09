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
import { dayTimes, weekday } from "@/lib/slots";
import { cn } from "cn";
import type { Counts, MeetEvent, MeetResponse } from "@/lib/types";

const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
  "bg-pink-500", "bg-rose-500", "bg-[#94a3b8]",
];

function cellClass(count: number, max: number, me: boolean): string {
  if (count === 0) return "bg-muted/60 hover:bg-muted";
  const ratio = count / max;
  const alpha = 0.25 + ratio * 0.65;
  return me
    ? `bg-primary/70 hover:bg-primary/80 ring-1 ring-primary`
    : `bg-emerald-500/${Math.round(alpha * 100)} hover:bg-emerald-500/${Math.round(alpha * 100 + 10)}`;
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

  const toggle = useCallback((slot: string) => {
    setMine((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      save(next);
      return next;
    });
  }, [save]);

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

  function register() {
    const n = name.trim();
    if (!n) {
      nameRef.current?.focus();
      return;
    }
    localStorage.setItem(`meet:${id}`, n);
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
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" ref={nameRef} placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && register()} maxLength={50} />
              </div>
              <Button onClick={register}>
                <UserPlus className="h-4 w-4 mr-1" /> Start voting
              </Button>
            </CardContent>
          </Card>
        )}

        {savedAs && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Voting as {savedAs}
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Click cells to mark yourself available</CardTitle>
            <CardDescription>
              Darker green = more people free. Your votes show up immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {/* header row: dates */}
                <div className="grid" style={{ gridTemplateColumns: `64px repeat(${ev.dates.length}, 1fr)` }}>
                  <div />
                  {ev.dates.map((d) => (
                    <div key={d} className="text-center pb-2">
                      <div className="text-xs text-muted-foreground">{weekday(d)}</div>
                      <div className="text-sm font-semibold">{d.slice(5)}</div>
                    </div>
                  ))}
                </div>
                {/* time rows */}
                <div className="space-y-0.5">
                  {times.map((t) => (
                    <div key={t} className="grid" style={{ gridTemplateColumns: `64px repeat(${ev.dates.length}, 1fr)` }}>
                      <div className="text-xs text-muted-foreground pr-2 pt-1 text-right">{t}</div>
                      {ev.dates.map((d) => {
                        const slot = `${d}T${t}`;
                        const count = ev.counts[slot] || 0;
                        const me = mine.has(slot);
                        return (
                          <TooltipProvider key={slot}>
                            <Tooltip>
                              <TooltipTrigger
                                className={`h-7 rounded-sm transition-colors ${cellClass(count, ev.max, me)} ${savedAs ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                                aria-label={`${d} ${t} — ${count} free`}
                                onClick={() => savedAs && toggle(slot)}
                                disabled={!savedAs || busy}
                              >
                                <span className="sr-only">{`${d} ${t} — ${count} free`}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {count ? `${count} ${count === 1 ? "person" : "people"} free` : "No one free yet"} — {t}
                                {me && " (you)"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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