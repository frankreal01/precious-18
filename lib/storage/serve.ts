import { NextResponse } from "next/server";
import { get } from "./s3";

// Streams a stored file back to the browser and honours Range requests.
// iPhone Safari will not play <video>/<audio> unless the server answers byte-range
// requests with 206 Partial Content, so this is what makes media work on iOS.
export async function serveMedia(req: Request, storageKey: string, mimeType: string) {
  const header = req.headers.get("range");
  const range = header && /^bytes=\d*-\d*$/.test(header) ? header : undefined;

  let object;
  try {
    object = await get(storageKey, range);
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "InvalidRange" || err.$metadata?.httpStatusCode === 416) return new NextResponse(null, { status: 416 });
    throw error;
  }
  if (!object.Body) return new NextResponse("Not found", { status: 404 });

  const bytes = await object.Body.transformToByteArray();
  const body = new Uint8Array(bytes.byteLength);
  body.set(bytes);
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Content-Length": String(bytes.byteLength),
    "Content-Disposition": "inline",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  if (range && object.ContentRange) {
    headers["Content-Range"] = object.ContentRange;
    return new NextResponse(body, { status: 206, headers });
  }
  return new NextResponse(body, { headers });
}
