export interface MeetEvent {
  id: string;
  title: string;
  dates: string[];
  start: string; // "09:00"
  end: string; // "21:00"
  step: number; // minutes
}

export interface MeetResponse {
  name: string;
  slots: string[]; // "2026-09-10T09:00"
}

export type Counts = Record<string, number>;