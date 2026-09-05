import Link from "next/link";
import { BrandLogo, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";

export function AppTopbar() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          aria-label={APP_NAME}
          className="flex items-center lg:hidden"
        >
          <BrandLogo height={22} />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/styleguide" />}
          >
            Styleguide
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
