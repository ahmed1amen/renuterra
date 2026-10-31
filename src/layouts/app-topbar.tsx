import Link from "next/link";
import { BrandLogo, ThemeToggle } from "@/components/shared";
import { APP_NAME } from "@/constants";
import { CommandPalette } from "./command-palette";

export function AppTopbar() {
  return (
    <header className="border-border bg-card/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
        <Link
          href="/"
          aria-label={APP_NAME}
          className="flex items-center lg:hidden"
        >
          <BrandLogo height={22} />
        </Link>
        <div className="flex flex-1 justify-center lg:justify-start">
          <CommandPalette />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
