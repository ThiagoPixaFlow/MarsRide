import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { Location } from "@/modules/locations/location.types";
import { normalizeText } from "@/lib/utils";

export class LocationService {
  private cache: Location[] | null = null;

  async getLocations(): Promise<Location[]> {
    if (this.cache) return this.cache;

    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/locations");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            this.cache = json.data;
            return json.data;
          }
        }
      }
    } catch {
      // Fallback gracioso
    }

    this.cache = LOCATIONS_SEED;
    return LOCATIONS_SEED;
  }

  async getLocationById(id: string): Promise<Location | null> {
    const locs = await this.getLocations();
    return locs.find((l) => l.id === id) ?? null;
  }

  async searchLocations(query: string): Promise<Location[]> {
    const locs = await this.getLocations();
    const clean = normalizeText(query);
    if (!clean) return locs;

    return locs.filter((loc) => {
      const matchName = normalizeText(loc.name).includes(clean);
      const matchShort = normalizeText(loc.shortName).includes(clean);
      const matchDistrict = normalizeText(loc.district).includes(clean);
      const matchHighlight = loc.highlights.some((h) => normalizeText(h).includes(clean));
      return matchName || matchShort || matchDistrict || matchHighlight;
    });
  }
}

export const locationService = new LocationService();
