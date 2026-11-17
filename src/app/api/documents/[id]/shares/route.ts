import { accessible, actor, failure, jsonBody } from "@/lib/db";
import { AppError, validateShare } from "@/lib/domain";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Context) {
  try {
    const user = actor(req);
    const { document, recipients } = await accessible(
      (await ctx.params).id,
      user,
    );
    if (document.owner_id !== user)
      throw new AppError("Only the owner can view sharing settings.", 403);
    return Response.json(recipients);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    const user = actor(req);
    const { client, document, recipients } = await accessible(
      (await ctx.params).id,
      user,
    );
    const { recipient } = await jsonBody(req);
    validateShare(document.owner_id, user, recipient, recipients);
    const result = await client
      .from("document_shares")
      .insert({ document_id: document.id, recipient_id: recipient });
    if (result.error?.code === "23505")
      throw new AppError("Already shared with this person.", 409);
    if (result.error) throw result.error;
    return Response.json({ shared: true }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
