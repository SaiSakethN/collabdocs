import { actor, db, failure, jsonBody } from "@/lib/db";
import { emptyContent, titleOf, validateContent } from "@/lib/domain";
export async function GET(req: Request) {
  try {
    const user = actor(req);
    const client = db();
    const shares = await client
      .from("document_shares")
      .select("document_id")
      .eq("recipient_id", user);
    if (shares.error) throw shares.error;
    const ids = shares.data.map((s) => s.document_id);
    const result = await client
      .from("documents")
      .select("*")
      .or(`owner_id.eq.${user}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`)
      .order("updated_at", { ascending: false });
    if (result.error) throw result.error;
    return Response.json(result.data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const user = actor(req);
    const body = await jsonBody(req);
    const result = await db()
      .from("documents")
      .insert({
        owner_id: user,
        title: titleOf(body.title),
        content: validateContent(body.content ?? emptyContent),
      })
      .select()
      .single();
    if (result.error) throw result.error;
    return Response.json(result.data, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
