// Redirect /owner to /owner/crypto
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/owner/crypto");
  }, [router]);
  return null;
}
