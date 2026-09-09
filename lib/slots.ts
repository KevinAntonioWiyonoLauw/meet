export function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function fmtMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Times shared across every day, e.g. ["09:00","09:30",...]
export function dayTimes(start: string, end: string, step: number): string[] {
  const out: string[] = [];
  for (let m = toMin(start); m < toMin(end); m += step) out.push(fmtMin(m));
  return out;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekday(d: string): string {
  return WEEKDAYS[new Date(`${d}T00:00:00`).getDay()];
}