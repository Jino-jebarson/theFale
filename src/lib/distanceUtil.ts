// src/lib/distanceUtil.ts
// Real Geographic Distance & Haversine Proximity Engine for Indian Healthcare

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

// Major Hospital Hubs and Localities in Bengaluru & Tier-1 Indian Cities
export const LOCALITY_COORDINATES: Record<string, GeoCoordinate> = {
  // Bengaluru Hubs
  "indiranagar": { lat: 12.9784, lng: 77.6408 },
  "koramangala": { lat: 12.9352, lng: 77.6245 },
  "whitefield": { lat: 12.9698, lng: 77.7499 },
  "jayanagar": { lat: 12.9308, lng: 77.5838 },
  "bannerghatta": { lat: 12.8948, lng: 77.5996 },
  "hebbal": { lat: 13.0358, lng: 77.5970 },
  "malleshwaram": { lat: 13.0031, lng: 77.5643 },
  "electronic city": { lat: 12.8399, lng: 77.6770 },
  "hsr layout": { lat: 12.9121, lng: 77.6446 },
  "btm layout": { lat: 12.9166, lng: 77.6101 },
  "marathahalli": { lat: 12.9591, lng: 77.6974 },
  "rajajinagar": { lat: 12.9982, lng: 77.5530 },
  "yelahanka": { lat: 13.1007, lng: 77.5963 },
  "cunningham road": { lat: 12.9863, lng: 77.5960 },
  "old airport road": { lat: 12.9590, lng: 77.6534 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },

  // Other Major Cities
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "delhi": { lat: 28.7041, lng: 77.1025 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "mysuru": { lat: 12.2958, lng: 76.6394 },
  "mysore": { lat: 12.2958, lng: 76.6394 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "mangalore": { lat: 12.9141, lng: 74.8560 },
};

// Hospital Landmark Mapping
export const HOSPITAL_LOCALITY_MAPPING: Record<string, string> = {
  "manipal": "old airport road",
  "apollo": "bannerghatta",
  "fortis": "cunningham road",
  "narayana": "electronic city",
  "st. john": "koramangala",
  "aster": "hebbal",
  "sakra": "marathahalli",
  "cloudnine": "jayanagar",
  "columbia asia": "hebbal",
  "sparsh": "rajajinagar",
};

/**
 * Calculates straight-line distance in kilometers using standard Haversine formula
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolves coordinate for a text description (locality or city)
 */
export function resolveGeoCoordinate(text?: string, hospitalName?: string): GeoCoordinate {
  const clean = (text || "").toLowerCase();

  // 1. Check if hospital landmark is known
  if (hospitalName) {
    const hLower = hospitalName.toLowerCase();
    for (const [key, loc] of Object.entries(HOSPITAL_LOCALITY_MAPPING)) {
      if (hLower.includes(key)) {
        return LOCALITY_COORDINATES[loc] || LOCALITY_COORDINATES["bengaluru"];
      }
    }
  }

  // 2. Check locality dictionary
  for (const [loc, coords] of Object.entries(LOCALITY_COORDINATES)) {
    if (clean.includes(loc)) {
      return coords;
    }
  }

  // Default fallback: Central Bengaluru
  return LOCALITY_COORDINATES["bengaluru"];
}

/**
 * Estimates real geographic distance between candidate and hospital
 */
export function estimateDistanceKm(
  candidateLoc: { city?: string; address?: string; pincode?: string },
  jobLoc: { city?: string; org?: string }
): { distanceKm: number; isSameCity: boolean; description: string } {
  const candCoord = resolveGeoCoordinate(`${candidateLoc.address || ""} ${candidateLoc.city || ""}`);
  const jobCoord = resolveGeoCoordinate(jobLoc.city, jobLoc.org);

  const cCity = (candidateLoc.city || "bengaluru").toLowerCase();
  const jCity = (jobLoc.city || "bengaluru").toLowerCase();

  const isSameCity = cCity.includes(jCity) || jCity.includes(cCity) || (cCity.includes("bangalore") && jCity.includes("bengaluru"));

  let dist = calculateHaversineDistanceKm(candCoord.lat, candCoord.lng, jobCoord.lat, jobCoord.lng);

  // If coordinates resolve to same exact point (e.g. general city center), add a sensible baseline commute
  if (dist === 0) {
    dist = 3.4;
  }

  return {
    distanceKm: dist,
    isSameCity,
    description: isSameCity ? `${dist} km away` : `${dist} km (Inter-City / Relocation)`,
  };
}

