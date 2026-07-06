"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      router.replace(`/verify/${token}`);
    } else {
      router.replace("/consumer");
    }
  }, [router, searchParams]);

  return null;
}

export default function VerifyRedirectPage() {
  return (
    <Suspense fallback={null}>
      <VerifyRedirectContent />
    </Suspense>
  );
}
