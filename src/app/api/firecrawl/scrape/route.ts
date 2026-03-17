import { NextRequest, NextResponse } from "next/server";

interface FirecrawlPayload {
  url?: string;
}

function safeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FirecrawlPayload;
    const url = safeText(body.url).trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "Only http/https URLs are supported." },
        { status: 400 }
      );
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FIRECRAWL_API_KEY on server." },
        { status: 500 }
      );
    }

    const firecrawlRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
      cache: "no-store",
    });

    const rawText = await firecrawlRes.text();
    let json: unknown;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = { message: rawText };
    }

    if (!firecrawlRes.ok) {
      const errorMessage =
        typeof json === "object" &&
        json &&
        "error" in json &&
        typeof (json as { error?: unknown }).error === "string"
          ? (json as { error: string }).error
          : "Firecrawl request failed.";

      return NextResponse.json(
        { error: errorMessage, details: json },
        { status: firecrawlRes.status }
      );
    }

    const result =
      typeof json === "object" && json && "data" in json
        ? (json as { data?: Record<string, unknown> }).data ?? {}
        : (json as Record<string, unknown>);

    const markdown = safeText(result.markdown).slice(0, 24_000);
    const html = safeText(result.html).slice(0, 24_000);
    const metadata =
      typeof result.metadata === "object" && result.metadata
        ? (result.metadata as Record<string, unknown>)
        : {};
    const title = safeText(metadata.title);
    const description = safeText(metadata.description);

    return NextResponse.json({
      success: true,
      result: {
        source_url: url,
        title,
        description,
        markdown,
        html,
        metadata,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected server error while scraping.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
