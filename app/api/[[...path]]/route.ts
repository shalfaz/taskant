import type { Handler } from "serverless-http";
import serverless from "serverless-http";
import type { NextRequest } from "next/server";
import { app, initializeApi } from "../../../server/src/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const expressHandler = serverless(app) as Handler;

interface ExpressResponse {
  statusCode: number;
  headers?: Record<string, string | string[] | number | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
}

async function forwardToExpress(request: NextRequest): Promise<Response> {
  try {
    await initializeApi();
  } catch {
    return Response.json(
      { message: "TaskAnt API configuration is incomplete or its database is unavailable." },
      { status: 503 },
    );
  }

  try {
    const url = new URL(request.url);
    const body = Buffer.from(await request.arrayBuffer());
    const event = {
      version: "2.0",
      routeKey: "$default",
      rawPath: url.pathname,
      rawQueryString: url.search.slice(1),
      headers: Object.fromEntries(request.headers.entries()),
      requestContext: {
        http: {
          method: request.method,
          path: url.pathname,
          protocol: "HTTP/1.1",
          sourceIp: request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1",
          userAgent: request.headers.get("user-agent") ?? "",
        },
      },
      body: body.length ? body.toString("base64") : undefined,
      isBase64Encoded: body.length > 0,
    };

    const result = (await expressHandler(event, {})) as ExpressResponse;
    const responseHeaders = new Headers();

    for (const [name, value] of Object.entries(result.headers ?? {})) {
      if (typeof value === "string" || typeof value === "number") {
        responseHeaders.set(name, String(value));
      } else if (Array.isArray(value)) {
        for (const item of value) responseHeaders.append(name, item);
      }
    }

    const responseBody =
      request.method === "HEAD" ||
      result.statusCode === 204 ||
      result.statusCode === 205 ||
      result.statusCode === 304
        ? null
        : result.isBase64Encoded
          ? Buffer.from(result.body ?? "", "base64")
          : result.body ?? null;

    return new Response(responseBody, {
      status: result.statusCode,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export const GET = forwardToExpress;
export const HEAD = forwardToExpress;
export const POST = forwardToExpress;
export const PUT = forwardToExpress;
export const PATCH = forwardToExpress;
export const DELETE = forwardToExpress;
export const OPTIONS = forwardToExpress;
