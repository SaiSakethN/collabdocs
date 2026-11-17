import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AppError, canEdit, identity, type Document } from "./domain";
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new AppError(
      "Database setup required: configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run supabase/schema.sql.",
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function actor(req: Request) {
  return identity(req.headers.get("x-demo-user"));
}
export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers.get("content-length")) > 2_100_000)
    throw new AppError("Document is too large.", 413);
  const value: unknown = await req.json();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError("Expected a JSON object.");
  return value as Record<string, unknown>;
}
export function failure(error: unknown) {
  if (error instanceof SyntaxError)
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    "Database operation failed",
    error instanceof Error ? error.message : "Unexpected error",
  );
  return Response.json(
    {
      error:
        "The operation failed. Please retry. Check database setup if this persists.",
    },
    { status: 500 },
  );
}
export async function accessible(id: string, user: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new AppError("Document not found.", 404);
  const client = db();
  const { data, error } = await client
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("Document not found.", 404);
  const shares = await client
    .from("document_shares")
    .select("recipient_id")
    .eq("document_id", id);
  if (shares.error) throw shares.error;
  const recipients = shares.data.map((s) => s.recipient_id as string);
  if (!canEdit(data.owner_id, user, recipients))
    throw new AppError("You do not have access to this document.", 403);
  return { client, document: data as Document, recipients };
}
