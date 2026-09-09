"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { CalendarDays, ChevronDown, ExternalLink, LogOut, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Event = { id: string; title: string; dates: string[]; start: string; end: string; step: number; created_at: string; participant_count: number; selected_slots: number };
type Response = { name: string; slots: string[] };

export function AdminDashboard({ email, events, responses }: { email: string; events: Event[]; responses: Record<string, Response[]> }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(() => events.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()) || e.id.toLowerCase().includes(query.toLowerCase())), [events, query]);
  const totalVotes = events.reduce((sum, e) => sum + Number(e.participant_count), 0);

  return (
    <main className="min-h-screen bg-muted/30 px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm text-muted-foreground">Meet dashboard</p><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All schedules</h1><p className="text-sm text-muted-foreground mt-1">{email}</p></div>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/admin/login" })}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat icon={<CalendarDays />} label="Events" value={events.length} />
          <Stat icon={<Users />} label="Participants" value={totalVotes} />
          <Stat icon={<CalendarDays />} label="Selected slots" value={events.reduce((s, e) => s + Number(e.selected_slots), 0)} />
        </div>
        <Card><CardContent className="pt-6"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search event title or ID..." value={query} onChange={(e) => setQuery(e.target.value)} /></div></CardContent></Card>
        <div className="space-y-3">
          {filtered.map((event) => <EventRow key={event.id} event={event} data={responses[event.id] || []} open={open === event.id} onToggle={() => setOpen(open === event.id ? null : event.id)} />)}
          {!filtered.length && <Card><CardContent className="py-12 text-center text-muted-foreground">No events found.</CardContent></Card>}
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card><CardContent className="pt-5"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{label}</span></div><p className="text-2xl font-bold mt-2">{value}</p></CardContent></Card>; }

function EventRow({ event, data, open, onToggle }: { event: Event; data: Response[]; open: boolean; onToggle: () => void }) {
  return <Card className="overflow-hidden"><button className="w-full text-left p-4 sm:p-5 hover:bg-muted/40 transition-colors" onClick={onToggle}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold truncate">{event.title}</h2><p className="text-xs text-muted-foreground mt-1 font-mono">/meet/{event.id}</p></div><ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} /></div><div className="flex flex-wrap gap-2 mt-3"><Badge variant="secondary">{event.dates.length} days</Badge><Badge variant="secondary">{data.length} participants</Badge><Badge variant="outline">{event.start}–{event.end}</Badge></div></button>{open && <div className="border-t px-4 sm:px-5 py-4 space-y-4"><div className="flex flex-wrap gap-2">{data.map((r) => <Badge key={r.name} variant="outline">{r.name} · {r.slots.length} slots</Badge>)}</div><Separator /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => window.open(`/meet/${event.id}`, "_blank")}><ExternalLink className="h-4 w-4 mr-1" />Open event</Button><span className="text-xs text-muted-foreground self-center">Created {new Date(event.created_at + "Z").toLocaleString()}</span></div></div>}</Card>;
}