import type { GoogleBusinessProfile } from "@/types";

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.primaryTypeDisplayName",
  "places.photos",
].join(",");

function getApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
}

function photoUrl(photoName: string, apiKey: string, maxWidth = 400) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
}

function mapPlace(
  place: Record<string, unknown>,
  apiKey: string
): GoogleBusinessProfile {
  const displayName = place.displayName as { text?: string } | undefined;
  const primaryType = place.primaryTypeDisplayName as
    | { text?: string }
    | undefined;
  const photos = place.photos as { name?: string }[] | undefined;
  const placeId = String(place.id ?? "").replace("places/", "");

  return {
    place_id: placeId,
    name: displayName?.text ?? "İşletme",
    address: (place.formattedAddress as string) ?? null,
    rating: (place.rating as number) ?? null,
    review_count: (place.userRatingCount as number) ?? null,
    phone: (place.nationalPhoneNumber as string) ?? null,
    website: (place.websiteUri as string) ?? null,
    maps_url: (place.googleMapsUri as string) ?? null,
    photo_url:
      photos?.[0]?.name && apiKey ? photoUrl(photos[0].name, apiKey) : null,
    category: primaryType?.text ?? null,
  };
}

export function isGooglePlacesConfigured() {
  return Boolean(getApiKey());
}

export async function searchGooglePlaces(
  query: string
): Promise<{ results: GoogleBusinessProfile[] } | { error: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      error:
        "Google Places API yapılandırılmamış. GOOGLE_MAPS_API_KEY ekleyin veya manuel bağlantı kullanın.",
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "tr",
      regionCode: "TR",
      maxResultCount: 5,
    }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Places search failed:", body);
    return { error: "Google araması başarısız oldu. Sorguyu değiştirip tekrar deneyin." };
  }

  const data = (await res.json()) as { places?: Record<string, unknown>[] };
  const results = (data.places ?? []).map((p) => mapPlace(p, apiKey));

  return { results };
}

export async function getGooglePlaceDetails(
  placeId: string
): Promise<GoogleBusinessProfile | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACES_FIELD_MASK.replace(/places\./g, ""),
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return null;

  const place = (await res.json()) as Record<string, unknown>;
  return mapPlace(place, apiKey);
}

export function buildGoogleSearchUrl(name: string, city?: string | null) {
  const q = encodeURIComponent([name, city].filter(Boolean).join(" "));
  return `https://www.google.com/search?q=${q}`;
}

export function buildMapsEmbedUrl(
  placeId: string | null,
  query: string | null,
  apiKey: string | null
) {
  if (apiKey && placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}&language=tr`;
  }
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=tr`;
  }
  return null;
}

export function parseGoogleMapsUrl(url: string): { placeId?: string; query?: string } {
  try {
    const parsed = new URL(url);
    const placeId =
      parsed.searchParams.get("place_id") ??
      parsed.pathname.match(/place\/([^/]+)/)?.[1];

    if (placeId) return { placeId: decodeURIComponent(placeId) };

    const q = parsed.searchParams.get("q");
    if (q) return { query: q };

    return { query: url };
  } catch {
    return { query: url };
  }
}
