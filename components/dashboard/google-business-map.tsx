import { buildMapsEmbedUrl } from "@/lib/google-places";

export function GoogleBusinessMap({
  placeId,
  mapsUrl,
  query,
  apiKey,
}: {
  placeId: string | null;
  mapsUrl: string | null;
  query: string;
  apiKey: string | null;
}) {
  const embedUrl =
    buildMapsEmbedUrl(placeId, query, apiKey) ??
    (mapsUrl ? `${mapsUrl}&output=embed` : null);

  if (!embedUrl) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Harita önizlemesi için Google işletme profili bağlayın
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <iframe
        title="Google Harita"
        src={embedUrl}
        className="h-64 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
