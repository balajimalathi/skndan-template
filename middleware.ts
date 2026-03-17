import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/db";

function getSubdomain(host: string | null): string | null {
  if (!host) return null;
  const parts = host.split(":")[0]!.split(".");
  if (parts.length < 3) return null;
  const [subdomain] = parts;
  if (subdomain === "www") return null;
  return subdomain;
}

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);

  // Always include the current pathname so layouts/pages can branch on it.
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  // Subdomain-based organization resolution
  const subdomain = getSubdomain(req.headers.get("host"));
  if (subdomain) {
    const org = await db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.slug, subdomain),
    });
    if (org) {
      requestHeaders.set("x-org-id", org.id);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Run on all app routes so `x-pathname` is always available,
  // and still support dashboard subdomain resolution.
  matcher: ["/:path*"],
};

