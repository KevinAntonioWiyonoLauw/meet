import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Counts, MeetResponse } from "@/lib/types";

function loadEvent(id: string) {
  const ev = getDb().prepare("SELECT * FROM events WHERE id=?").get(id) as Record<string, any> | undefined;
  if (!ev) return null;
  const rows = getDb().prepare("SELECT name, slots FROM responses WHERE event_id=?").all(id) as { name: string; slots: string }[];
  const responses: MeetResponse[] = rows.map((r) => ({ name: r.name, slots: JSON.parse(r.slots) as string[] }));
  const counts: Counts = {};
  for (const r of responses) for (const s of r.slots) counts[s] = (counts[s] || 0) + 1;
  const max = Object.values(counts).reduce((a, b) => Math.max(a, b), 0);
  return {
    id: ev.id, title: ev.title, dates: JSON.parse(ev.dates), start: ev.start, end: ev.end, step: ev.step,
    responses, counts, max,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = loadEvent(id);
  if (!data) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim())
    return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!Array.isArray(body.slots) || !body.slots.every((s: unknown) => typeof s === "string"))
    return NextResponse.json({ error: "slots must be an array of strings" }, { status: 400 });

  const exists = getDb().prepare("SELECT 1 FROM events WHERE id=?").get(id);
  if (!exists) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (body.slots.length === 0) {
    getDb().prepare("DELETE FROM responses WHERE event_id=? AND name=?").run(id, body.name.trim());
  } else {
    getDb().prepare(
      `INSERT INTO responses (event_id, name, slots) VALUES (?, ?, ?)
       ON CONFLICT(event_id, name) DO UPDATE SET slots = excluded.slots, updated_at = datetime('now')`
    ).run(id, body.name.trim().slice(0, 50), JSON.stringify(body.slots));
  }

  return NextResponse.json(loadEvent(id));
}