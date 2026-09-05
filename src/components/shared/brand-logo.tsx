import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "../../../public/brand/renuterra-logo.png";

type BrandLogoProps = {
  /** Rendered height in px. Minimum 22 in the top bar, 16 in email footers. */
  height?: number;
  /**
   * Sit the logo on a white plate in dark mode, where the near-black wordmark
   * would otherwise vanish. In light mode the artwork is transparent and sits
   * directly on the surface. Needed until a white-on-dark variant is supplied.
   */
  plate?: boolean;
  className?: string;
};

/** The supplied Renuterra logo. Never redrawn or recoloured. */
export function BrandLogo({
  height = 24,
  plate = false,
  className,
}: BrandLogoProps) {
  const width = Math.round((logo.width / logo.height) * height);
  const img = (
    <Image
      src={logo}
      alt="Renuterra"
      width={width}
      height={height}
      priority
      className="block"
      style={{ height, width }}
    />
  );

  if (!plate)
    return <span className={cn("inline-flex", className)}>{img}</span>;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md dark:bg-white dark:px-2 dark:py-1",
        className,
      )}
    >
      {img}
    </span>
  );
}
