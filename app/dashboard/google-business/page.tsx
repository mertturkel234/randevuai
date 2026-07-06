import { getCurrentBusiness } from "@/lib/auth";
import { GoogleBusinessSetup } from "@/components/dashboard/google-business-setup";
import { GoogleBusinessMap } from "@/components/dashboard/google-business-map";
import { GoogleBusinessResultCard } from "@/components/dashboard/google-business-result-card";
import { isGooglePlacesConfigured } from "@/lib/google-places";
import type { GoogleBusinessProfile } from "@/types";

export default async function GoogleBusinessPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const profile = business.google_business_data as GoogleBusinessProfile | null;
  const placesConfigured = isGooglePlacesConfigured();
  const mapsApiKey = Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Google İşletme</h1>
        <p className="text-slate-500">
          İşletmenizin Google aramasındaki görünümünü bağlayın ve panelde
          gösterin
        </p>
      </div>

      {profile && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GoogleBusinessResultCard
            profile={profile}
            searchFallback={{ name: business.name, city: business.city }}
          />
          <GoogleBusinessMap
            placeId={business.google_place_id}
            mapsUrl={business.google_business_url}
            query={[business.name, business.city].filter(Boolean).join(", ")}
            apiKey={process.env.GOOGLE_MAPS_API_KEY ?? null}
          />
        </div>
      )}

      <GoogleBusinessSetup
        business={business}
        placesConfigured={placesConfigured}
        mapsApiKey={mapsApiKey}
      />
    </div>
  );
}
