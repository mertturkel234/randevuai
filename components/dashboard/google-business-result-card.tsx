"use client";

import Image from "next/image";
import { ExternalLink, MapPin, Phone, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GoogleBusinessProfile } from "@/types";
import { buildGoogleSearchUrl } from "@/lib/google-places";

export function GoogleBusinessResultCard({
  profile,
  compact = false,
  searchFallback,
}: {
  profile: GoogleBusinessProfile;
  compact?: boolean;
  searchFallback?: { name: string; city?: string | null };
}) {
  const searchUrl =
    profile.maps_url ??
    (searchFallback
      ? buildGoogleSearchUrl(searchFallback.name, searchFallback.city)
      : null);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={compact ? "p-4" : "p-5"}>
        <div className="flex gap-4">
          {profile.photo_url ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={profile.photo_url}
                alt={profile.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-2xl font-bold text-emerald-600">
              {profile.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-blue-700 hover:underline">
                  {profile.name}
                </h3>
                {profile.category && (
                  <p className="text-sm text-slate-500">{profile.category}</p>
                )}
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Google
              </span>
            </div>

            {profile.rating != null && (
              <div className="mt-1 flex items-center gap-1 text-sm">
                <span className="font-medium text-amber-500">
                  {profile.rating.toFixed(1)}
                </span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(profile.rating ?? 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                {profile.review_count != null && (
                  <span className="text-slate-500">
                    ({profile.review_count} yorum)
                  </span>
                )}
              </div>
            )}

            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {profile.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{profile.address}</span>
                </p>
              )}
              {profile.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{profile.phone}</span>
                </p>
              )}
              {profile.website && (
                <p className="flex items-center gap-2 truncate">
                  <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-blue-600">{profile.website}</span>
                </p>
              )}
            </div>

            {searchUrl && (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Google&apos;da Görüntüle
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
