import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

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
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        const envEmail = String(process.env.CREDENTIAL_EMAIL ?? "")
          .trim()
          .toLowerCase();

        const envPassword = String(process.env.CREDENTIAL_PASSWORD ?? "").trim();

        // Fail closed if misconfigured
        if (!envEmail || !envPassword) return null;

        if (email !== envEmail) return null;
        if (password !== envPassword) return null;

        return {
          id: "me",
          email: envEmail,
          name: "Owner",
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials already validated
      if (account?.provider === "credentials") return true;

      // Restrict Google to allowlist
      const allowed = (process.env.ALLOWED_EMAIL ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (allowed.length === 0) return false;

      const email =
        user.email?.toLowerCase() ??
        (profile as any)?.email?.toLowerCase() ??
        "";

      return allowed.includes(email);
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});




