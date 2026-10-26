'use server';
import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function login(_previous:string|undefined, form:FormData) {
  try {
    await signIn('credentials', {username:form.get('username'),password:form.get('password'),redirectTo:'/'});
  } catch (error) {
    if (error instanceof AuthError) return 'Unable to sign in. Check your credentials or try again in 15 minutes.';
    throw error;
  }
}
export async function logout() { await signOut({redirectTo:'/login'}); }
