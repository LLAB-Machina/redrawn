import type { NextApiRequest, NextApiResponse } from "next";
import axios, { Method } from "axios";

const DEFAULT_API_BASE_URL =
  process.env.API_PROXY_TARGET || "http://localhost:8080";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query;

  const customApiUrlHeader = req.headers["x-custom-api-url"] as string;
  const customApiUrlParam = (req.query.custom_api_url as string) || "";
  const customApiUrl = customApiUrlHeader || customApiUrlParam;
  const API_BASE_URL = customApiUrl || DEFAULT_API_BASE_URL;

  const path = Array.isArray(slug) ? slug.join("/") : (slug as string) || "";

  let targetUrl: string;
  if (path === "health") {
    // Align with backend health route
    targetUrl = `${API_BASE_URL}/v1/health`;
  } else {
    // Forward directly without injecting an extra "/api" prefix.
    // Backend routes like "/v1/..." should map to "${API_BASE_URL}/v1/...".
    targetUrl = `${API_BASE_URL}/${path}`;
  }

  try {
    const upstreamResponse = await axios({
      method: req.method as Method,
      url: targetUrl,
      data: req.body,
      // Do NOT follow backend redirects; the browser must receive the 302
      // so it can keep the original origin and set cookies correctly.
      maxRedirects: 0,
      headers: {
        "content-type": req.headers["content-type"] as string,
        authorization: req.headers["authorization"] as string,
        "user-agent": req.headers["user-agent"] as string,
        // forward cookies for session-based auth
        cookie: req.headers.cookie as string,
        // optional auth token passthrough
        ...(req.cookies.auth_token && {
          "x-auth-token": req.cookies.auth_token,
        }),
      },
      params: (() => {
        const queryParams = { ...req.query } as {
          [key: string]: string | string[] | undefined;
        };
        delete queryParams.slug;
        delete queryParams.custom_api_url;
        return queryParams;
      })(),
      responseType: "stream",
      validateStatus: () => true,
    });

    // For non-OK responses, buffer and shape a dev-friendly JSON with backend stack
    if (upstreamResponse.status >= 400) {
      // Read the upstream stream fully
      const chunks: any[] = [];
      for await (const chunk of upstreamResponse.data as any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyText = Buffer.concat(chunks as any).toString("utf8");
      let parsed: any = null;
      try {
        parsed = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        parsed = { raw: bodyText };
      }

      const isDev = process.env.NODE_ENV !== "production";
      const stackFromBackend = (() => {
        try {
          if (parsed?.errors && Array.isArray(parsed.errors)) {
            const itemWithStack = parsed.errors.find(
              (e: any) => e?.more && typeof e.more.stack === "string",
            );
            return itemWithStack?.more?.stack as string | undefined;
          }
          if (typeof parsed?.stack === "string") return parsed.stack;
          return undefined;
        } catch {
          return undefined;
        }
      })();

      // Always forward the status, and prefer JSON to surface details in dev tools
      res.status(upstreamResponse.status);
      res.setHeader("content-type", "application/json; charset=utf-8");
      if (stackFromBackend) {
        res.setHeader("x-backend-stack-present", "1");
      }

      if (isDev) {
        res.json({
          success: false,
          proxy_error: true,
          message:
            parsed?.detail ||
            parsed?.title ||
            parsed?.error ||
            "Request failed",
          backend: parsed,
          stack: stackFromBackend,
          status: upstreamResponse.status,
          url: targetUrl,
        });
      } else {
        // In prod, forward the upstream JSON (or raw text wrapper)
        if (typeof parsed === "object" && parsed) {
          res.json(parsed);
        } else {
          res.json({ success: false, message: "Request failed", body: parsed });
        }
      }
      return;
    }

    // Success path: stream through
    res.status(upstreamResponse.status);

    const headersToForward = [
      "content-type",
      "content-length",
      "cache-control",
      "etag",
      "last-modified",
      "expires",
      "set-cookie",
      "location",
    ];
    for (const headerName of headersToForward) {
      const value = upstreamResponse.headers[headerName];
      if (value) {
        res.setHeader(headerName, value as any);
      }
    }

    (upstreamResponse.data as NodeJS.ReadableStream).pipe(res);
  } catch (error) {
    // network/connection errors only
    console.error("Network error connecting to backend:", error);
    res.status(503).json({
      success: false,
      message: "Service unavailable - cannot connect to backend",
    });
  }
}
