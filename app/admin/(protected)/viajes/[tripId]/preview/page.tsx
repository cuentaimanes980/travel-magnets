import { notFound } from "next/navigation";
import { TripPageDocument } from "@/components/travel/TripPageDocument";
import { requireAdmin } from "@/lib/admin/auth";
import { loadSupabaseTrip } from "@/lib/travel-data/supabase";

export const dynamic = "force-dynamic";

export default async function TripPreviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { client } = await requireAdmin();
  const { tripId } = await params;
  const result = await client.from("trips").select("*").eq("slug", tripId).maybeSingle();
  if (result.error || !result.data) notFound();
  const trip = await loadSupabaseTrip(client, result.data as Record<string, unknown>);
  return <TripPageDocument trip={trip} preview />;
}
