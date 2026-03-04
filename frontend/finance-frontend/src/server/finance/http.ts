import { ZodError } from "zod";
import { requireSession } from "@/src/server/auth/require-session";

export async function withSession<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    await requireSession();
    const data = await fn();
    return Response.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { ok: false, error: "Validation failed", details: error.flatten() },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "Unauthorized") {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

