"use client";

import { useEffect, useState } from "react";

/** True only after hydration — gate client-only UI to avoid SSR mismatches. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
