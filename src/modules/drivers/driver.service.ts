import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { Driver } from "@/modules/drivers/driver.types";

export class DriverService {
  private cache: Driver[] | null = null;

  async getDrivers(): Promise<Driver[]> {
    if (this.cache) return this.cache;

    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/drivers");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            this.cache = json.data;
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    this.cache = DRIVERS_SEED;
    return DRIVERS_SEED;
  }

  async getDriverById(id: string): Promise<Driver | null> {
    const drivers = await this.getDrivers();
    return drivers.find((d) => d.id === id) ?? null;
  }

  async getActiveDrivers(): Promise<Driver[]> {
    const drivers = await this.getDrivers();
    return drivers.filter((d) => d.isActive);
  }
}

export const driverService = new DriverService();
