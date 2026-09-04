import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "../../../public/brand/renuterra-logo.webp";

type BrandLogoProps = {
  /** Rendered height in px. Minimum 22 in the top bar, 16 in email footers. */
  height?: number;
  /**
   * Sit the logo on a white plate. Required on dark surfaces until the
   * white-on-dark variant is supplied.
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
        "inline-flex items-center rounded-md bg-white px-2 py-1",
        className,
      )}
    >
      {img}
    </span>
  );
}
