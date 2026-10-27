import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from "./form";
import { Leaf, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export const dynamic = "force-dynamic";
export default async function Login() {
  if ((await auth())?.user) redirect("/");
  return (
    <main className="grid min-h-dvh place-items-center bg-secondary p-5">
      <Card className="w-full max-w-md gap-6 border-white/70 py-8 shadow-xl shadow-primary/5">
        <CardHeader className="px-7 sm:px-9">
          <a
            href="/"
            aria-label="Pocket home"
            className="mb-7 flex items-center gap-2 text-3xl font-bold tracking-tight"
          >
            <Leaf className="size-8 text-primary" />
            pocket<span className="-ml-2 text-primary">.</span>
          </a>
          <CardTitle className="font-serif text-3xl font-normal tracking-tight">
            <h1>Your money. Your space.</h1>
          </CardTitle>
          <CardDescription className="mt-2">
            Sign in to your private finance tracker.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-7 sm:px-9">
          <LoginForm />
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Your finances, privately stored.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
