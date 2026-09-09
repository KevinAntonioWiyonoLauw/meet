"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export function CreateEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("21:00");
  const [step, setStep] = useState(30);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function addDate() {
    if (!dateInput || dates.includes(dateInput)) return;
    setDates((d) => [...d, dateInput].sort());
    setDateInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dates, start, end, step }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/meet/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an event</CardTitle>
        <CardDescription>Pick the days that could work, then share the link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Event name</Label>
            <Input
              id="title"
              placeholder="e.g. Team sync — sprint planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Days</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addDate} disabled={!dateInput}>
                <CalendarPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {dates.length === 0 && <p className="text-xs text-muted-foreground">Add at least one day.</p>}
            {dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {dates.map((d) => (
                  <Badge key={d} variant="secondary" className="gap-1 pr-1">
                    {d}
                    <button
                      type="button"
                      aria-label={`Remove ${d}`}
                      className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                      onClick={() => setDates((ds) => ds.filter((x) => x !== d))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>From</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={start} onChange={(e) => setStart(e.target.value)}>
                {TIMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={end} onChange={(e) => setEnd(e.target.value)}>
                {TIMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Step</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={step} onChange={(e) => setStep(Number(e.target.value))}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={creating || dates.length === 0}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CalendarPlus className="h-4 w-4 mr-1" />}
            {creating ? "Creating…" : "Create event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}