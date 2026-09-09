import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <LoginForm />
    </main>
  );
}