import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  providers: [Credentials({
    credentials: { username: {}, password: {} },
    async authorize(credentials) {
      const input = z.object({username:z.string().min(1).max(100),password:z.string().min(1).max(72)}).safeParse(credentials);
      const owner = process.env.OWNER_USERNAME;
      const hash = process.env.OWNER_PASSWORD_HASH;
      if (!input.success || !owner || !hash || !process.env.AUTH_SECRET) return null;

      // Database-backed limit survives serverless restarts. No passwords are stored.
      const now = Date.now();
      const window = Math.floor(now / 900000);
      const id = createHash('sha256').update(`${owner}:${window}`).digest('hex');
      await db.loginAttempt.deleteMany({where:{expiresAt:{lt:new Date(now)}}});
      const attempt = await db.loginAttempt.upsert({where:{id},create:{id,expiresAt:new Date((window+1)*900000)},update:{attempts:{increment:1}}});
      if (attempt.attempts > 10) return null;
      const matches = await compare(input.data.password, hash);
      if (!matches || input.data.username !== owner) return null;
      return {id:'owner',name:owner};
    },
  })],
  callbacks: {
    async jwt({token,user}) {
      if (user) token.ownerVersion = createHash('sha256').update(`${process.env.OWNER_USERNAME}:${process.env.OWNER_PASSWORD_HASH}`).digest('hex');
      return token;
    },
    async session({session,token}) {
      const current = createHash('sha256').update(`${process.env.OWNER_USERNAME}:${process.env.OWNER_PASSWORD_HASH}`).digest('hex');
      if (token.sub !== 'owner' || token.ownerVersion !== current) return {...session,user:undefined};
      return session;
    },
  },
});
