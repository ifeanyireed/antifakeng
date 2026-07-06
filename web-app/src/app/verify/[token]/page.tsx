import { Suspense } from "react";
import ConsumerVerifyClient from "./ConsumerVerifyClient";

export async function generateStaticParams() {
  return [{ token: "fallback" }];
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={null}>
      <ConsumerVerifyClient params={params} />
    </Suspense>
  );
}
