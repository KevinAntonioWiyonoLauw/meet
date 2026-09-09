import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createId } from "@/lib/id";
import { dayTimes } from "@/lib/slots";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const dates = body.dates;
  const start = typeof body.start === "string" ? body.start : "";
  const end = typeof body.end === "string" ? body.end : "";
  const step = Number.isInteger(body.step) ? body.step : 30;

  if (!title || title.length > 120) return NextResponse.json({ error: "title required (max 120 chars)" }, { status: 400 });
  if (!Array.isArray(dates) || dates.length === 0 || dates.length > 31 || !dates.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)))
    return NextResponse.json({ error: "dates: 1-31 ISO dates required" }, { status: 400 });
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return NextResponse.json({ error: "start/end must be HH:MM" }, { status: 400 });
  if (![15, 30, 60].includes(step)) return NextResponse.json({ error: "step must be 15, 30 or 60" }, { status: 400 });
  if (dayTimes(start, end, step).length === 0) return NextResponse.json({ error: "end must be after start" }, { status: 400 });

  let id = createId();
  for (let i = 0; i < 5 && getDb().prepare("SELECT 1 FROM events WHERE id=?").get(id); i++) id = createId();

  getDb().prepare("INSERT INTO events (id, title, dates, start, end, step) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, title, JSON.stringify(dates), start, end, step
  );

  return NextResponse.json({ id }, { status: 201 });
}