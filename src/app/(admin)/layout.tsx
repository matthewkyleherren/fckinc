"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { UsersIcon, DownloadIcon, LogOutIcon } from "lucide-react";

const NAV_ITEMS = [
  { href: "/profiles", label: "Profiles", icon: UsersIcon },
  { href: "/import", label: "Import", icon: DownloadIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---- Desktop sidebar (≥md) ---- */}
      <aside className="hidden md:flex w-52 border-r border-border/60 flex-col">
        <div className="px-4 py-3 border-b border-border/60">
          <h1 className="font-heading text-sm font-semibold tracking-tight">fckinc</h1>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="text-xs text-muted-foreground mb-2 truncate">
            {user.email}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* ---- Mobile header (<md) ---- */}
      <div className="flex flex-1 flex-col md:hidden">
        <header className="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm">
          <h1 className="font-heading text-sm font-semibold tracking-tight">fckinc</h1>
          <Button variant="ghost" size="icon-sm" onClick={() => logout()} aria-label="Sign out">
            <LogOutIcon className="size-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>

        {/* ---- Bottom tab bar ---- */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-border/60 bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground active:text-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ---- Desktop main content (≥md) ---- */}
      <main className="hidden md:block flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
