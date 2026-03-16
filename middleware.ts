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
  const url = req.nextUrl.clone();

  // Subdomain-based organization resolution
  const subdomain = getSubdomain(req.headers.get("host"));
  if (subdomain) {
    const org = await db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.slug, subdomain),
    });
    if (org) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-org-id", org.id);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

