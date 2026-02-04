import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const allowedEmail = process.env.ALLOWED_EMAIL?.toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");

        // hard block if not the single allowed user
        if (!allowedEmail || email !== allowedEmail) return null;

        // must match configured credential email too
        const credEmail = process.env.CREDENTIAL_EMAIL?.toLowerCase();
        const hash = process.env.CREDENTIAL_PASSWORD_HASH;

        if (!credEmail || !hash) return null;
        if (email !== credEmail) return null;

        const ok = await bcrypt.compare(password, hash);
        if (!ok) return null;

        // minimal user object for JWT
        return { id: "me", email, name: "Owner" };
      },
    }),
  ],

  callbacks: {
    // also restrict Google sign-in to the allowed email
    async signIn({ user, account }) {
      if (!allowedEmail) return false;

      if (account?.provider === "google") {
        return user.email?.toLowerCase() === allowedEmail;
      }

      // credentials already validated in authorize()
      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
});
