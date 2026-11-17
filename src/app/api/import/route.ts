import { actor, db, failure } from "@/lib/db";
import { AppError, titleOf, validateContent } from "@/lib/domain";
import { importContent } from "@/lib/import";
export async function POST(req: Request) {
  try {
    const user = actor(req);
    if (Number(req.headers.get("content-length")) > 1_100_000)
      throw new AppError("Maximum file size is 1 MB.", 413);
    const file = (await req.formData()).get("file");
    if (!(file instanceof File))
      throw new AppError("Choose a .txt or .md file.");
    if (file.size > 1048576)
      throw new AppError("Maximum file size is 1 MB.", 413);
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      );
    } catch {
      throw new AppError("Use a readable UTF-8 text file.");
    }
    const content = validateContent(importContent(file.name, file.size, text));
    const result = await db()
      .from("documents")
      .insert({
        owner_id: user,
        title: titleOf(file.name.replace(/\.(txt|md)$/i, "").slice(0, 160)),
        content,
      })
      .select()
      .single();
    if (result.error) throw result.error;
    return Response.json(result.data, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
