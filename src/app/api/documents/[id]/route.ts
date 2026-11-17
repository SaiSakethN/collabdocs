import { accessible, actor, failure, jsonBody } from "@/lib/db";
import { AppError, titleOf, validateContent } from "@/lib/domain";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Context) {
  try {
    const { document } = await accessible((await ctx.params).id, actor(req));
    return Response.json(document, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    const { client, document } = await accessible(
      (await ctx.params).id,
      actor(req),
    );
    const body = await jsonBody(req);
    if (typeof body.version !== "number" || !Number.isInteger(body.version))
      throw new AppError("Document version required.");
    const result = await client
      .from("documents")
      .update({
        title: titleOf(body.title),
        content: validateContent(body.content),
        version: body.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id)
      .eq("version", body.version)
      .select()
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data)
      throw new AppError(
        "Another editor changed this document. Copy your changes before reopening the latest version.",
        409,
      );
    return Response.json(result.data);
  } catch (e) {
    return failure(e);
  }
}
