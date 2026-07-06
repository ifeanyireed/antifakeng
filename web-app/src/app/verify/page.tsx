import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;
  if (typeof token === "string" && token) {
    redirect(`/verify/${token}`);
  }
  redirect("/consumer");
}
