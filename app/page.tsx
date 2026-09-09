import { CalendarClock } from "lucide-react";
import { CreateEventForm } from "@/components/create-event-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
            <CalendarClock className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Meet<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Pick dates, share one link, find the time everybody&apos;s free. No accounts, no signup.
          </p>
        </div>
        <CreateEventForm />
      </div>
    </main>
  );
}