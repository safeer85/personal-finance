import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const ALLOWED_EMAIL = (process.env.AUTH_ALLOWED_EMAIL || "").toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // single-user lock
        if (email.toLowerCase() !== ALLOWED_EMAIL) return null;

        const hash = process.env.AUTH_CREDENTIALS_PASSWORD_HASH;
        if (!hash) return null;

        const ok = await bcrypt.compare(password, hash);
        if (!ok) return null;

        return {
          id: "owner",
          name: "Owner",
          email: ALLOWED_EMAIL,
        };
      },
    }),
  ],

  callbacks: {
    // Blocks Google or any other provider sign-in unless it's your allowed email
    async signIn({ user }) {
      const email = (user?.email || "").toLowerCase();
      return email === ALLOWED_EMAIL;
    },
  },
});
