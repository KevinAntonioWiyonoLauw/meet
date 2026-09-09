"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { CalendarClock, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/admin" });
      if (!result || result.error) {
        setError("Email atau password salah.");
        setLoading(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Login gagal. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-4">
        <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-2xl">Meet dashboard</CardTitle>
          <CardDescription className="mt-1">Login untuk lihat semua event dan hasil voting.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LockKeyhole className="h-4 w-4 mr-2" />}
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}