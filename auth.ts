import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = getDb().prepare("SELECT email, password_hash FROM admin_users WHERE email = ?").get(email) as
          | { email: string; password_hash: string }
          | undefined;
        if (!user || !verifyPassword(password, user.password_hash)) return null;
        return { id: user.email, email: user.email, name: "Kevin" };
      },
    }),
  ],
});