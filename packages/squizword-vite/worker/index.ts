/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }

    // For non-API requests, pass through to the static assets
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // Handle cases where the asset isn't found or other errors
      console.error("Asset fetch failed:", e);
      return new Response("Not found", { status: 404 });
    }
  },
} satisfies ExportedHandler<Env>; 