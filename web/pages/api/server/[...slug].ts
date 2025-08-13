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
    targetUrl = `${API_BASE_URL}/health`;
  } else if (path.startsWith("api/")) {
    targetUrl = `${API_BASE_URL}/${path}`;
  } else {
    targetUrl = `${API_BASE_URL}/api/${path}`;
  }

  try {
    const upstreamResponse = await axios({
      method: req.method as Method,
      url: targetUrl,
      data: req.body,
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

    res.status(upstreamResponse.status);

    const headersToForward = [
      "content-type",
      "content-length",
      "cache-control",
      "etag",
      "last-modified",
      "expires",
      "set-cookie",
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

