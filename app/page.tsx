import { auth } from "@/lib/auth/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Shield, ArrowRight, Layout, ArrowUpRight, LogOut, CalendarDays } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button-icon";
import HeroSection from "@/components/landing/hero";
export default async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="flex relative min-h-screen flex-col bg-background">
      <header className="relative z-20 border-b bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <CalendarDays className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">Skndan Cal</span>
          </div>
          <nav className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ModeToggle />
              {session?.user ? (
                <div className="flex gap-2 items-center">
                  <a href="/dashboard">
                    <Button
                      className="rounded-full flex items-center gap-2"
                      variant="outline"
                      size="default"
                    >
                      <Layout className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </a>
                  <LogoutButton />
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="rounded-full" variant="ghost">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="rounded-full">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <HeroSection />
      <footer className="w-full z-10 border-t border-border py-6 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0 text-muted-foreground">
            <CalendarDays className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Skndan Cal</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>Powered by Dodopayments</span>
          </div>
          <div className="text-sm text-muted-foreground mt-4 md:mt-0">
            © {new Date().getFullYear()} Skndan
          </div>
        </div>
      </footer>
    </div>
  );
}
