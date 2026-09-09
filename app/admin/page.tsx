import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");
  const db = getDb();
  const events = db.prepare(`
    SELECT e.id, e.title, e.dates, e.start, e.end, e.step, e.created_at,
      COUNT(r.name) AS participant_count,
      COALESCE(SUM(json_array_length(r.slots)), 0) AS selected_slots
    FROM events e LEFT JOIN responses r ON r.event_id = e.id
    GROUP BY e.id ORDER BY e.created_at DESC
  `).all() as Record<string, unknown>[];
  const responseRows = db.prepare("SELECT event_id, name, slots FROM responses ORDER BY name").all() as { event_id: string; name: string; slots: string }[];
  const grouped: Record<string, { name: string; slots: string[] }[]> = {};
  for (const r of responseRows) (grouped[r.event_id] ||= []).push({ name: r.name, slots: JSON.parse(r.slots) });
  const adminEvents = events.map((e) => ({ ...e, dates: JSON.parse(e.dates as string) })) as unknown as Parameters<typeof AdminDashboard>[0]["events"];
  return <AdminDashboard email={session.user.email} events={adminEvents} responses={grouped} />;
}