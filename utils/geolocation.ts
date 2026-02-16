/**
 * Geolocation utilities for proximity-based job acceptance
 * Uses browser Geolocation API + Nominatim for address geocoding
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Get the cleaner's current position via browser Geolocation API
 */
export function getCleanerPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access to accept jobs.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable. Please try again.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Unable to get your location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

// Simple in-memory cache for geocoded addresses
const geocodeCache = new Map<string, Coordinates>();

/**
 * Geocode an address string to coordinates using Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const cacheKey = address.trim().toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (results && results.length > 0) {
      const coords: Coordinates = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }

    return null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Check if a cleaner is within the allowed distance of a job address
 */
export async function checkProximity(
  cleanerPosition: Coordinates,
  jobAddress: string,
  maxDistanceMeters: number
): Promise<{ withinRange: boolean; distance: number | null; jobCoords: Coordinates | null }> {
  const jobCoords = await geocodeAddress(jobAddress);

  if (!jobCoords) {
    return { withinRange: false, distance: null, jobCoords: null };
  }

  const distance = haversineDistance(cleanerPosition, jobCoords);
  return {
    withinRange: distance <= maxDistanceMeters,
    distance: Math.round(distance),
    jobCoords,
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
