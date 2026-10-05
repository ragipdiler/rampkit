import { z } from "zod";
import { analyzeWebsite } from "../../../../../packages/extractor/src/analyze";
import { validateUrl } from "../../../../../packages/extractor/src/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let busy = false;
export async function POST(request: Request) {
  // A loopback listener can still receive a forged Host through DNS rebinding.
  let hostname: string;
  try {
    hostname = new URL(`http://${request.headers.get("host") ?? ""}`).hostname;
  } catch {
    hostname = "";
  }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname))
    return Response.json(
      { error: "Website analysis is available only on the local application." },
      { status: 403 },
    );
  const origin = request.headers.get("origin");
  const expectedOrigin = `${new URL(request.url).protocol}//${request.headers.get("host")}`;
  if (origin && origin !== expectedOrigin)
    return Response.json(
      { error: "Cross-origin analysis requests are not allowed." },
      { status: 403 },
    );
  if (busy)
    return Response.json(
      { error: "An analysis is already running. Try again when it finishes." },
      { status: 429 },
    );
  let url: string;
  try {
    const body = z
      .object({ url: z.string().min(1).max(2048) })
      .parse(await request.json());
    url = validateUrl(body.url).href;
  } catch {
    return Response.json(
      { error: "Enter a valid public HTTP(S) URL without credentials." },
      { status: 400 },
    );
  }
  // Recheck after parsing: another request may have acquired the browser slot.
  if (busy)
    return Response.json(
      { error: "An analysis is already running. Try again when it finishes." },
      { status: 429 },
    );
  busy = true;
  const abort = new AbortController();
  const onAbort = () => abort.abort();
  request.signal.addEventListener("abort", onAbort, { once: true });
  if (request.signal.aborted) abort.abort();
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        if (!cancelled)
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        const report = await analyzeWebsite(
          url,
          (stage) => send({ type: "progress", stage }),
          abort.signal,
        );
        send({ type: "result", report });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Analysis failed.",
        });
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        busy = false;
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      abort.abort();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
