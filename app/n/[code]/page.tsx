import { notFound, redirect } from "next/navigation";
import { resolveNfcCode } from "@/lib/travel-data";

type Props = { params: Promise<{ code: string }> };

export const dynamic = "force-dynamic";

export default async function NfcRedirectPage({ params }: Props) {
  const { code } = await params;
  const resolution = await resolveNfcCode(code);
  if (!resolution?.isActive) notFound();
  redirect(`/viajes/${resolution.tripSlug}`);
}
