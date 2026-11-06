import { mockStorage } from "@/mocks/storage";
import { Vehicle, VehicleCategory, VehicleOperationalStatus } from "@/modules/vehicles/vehicle.types";
import { SIMULATION_CONFIG } from "@/config/app.config";

export class VehicleService {
  async getVehicles(): Promise<Vehicle[]> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/vehicles/nearby");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    return mockStorage.getVehicles();
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const vehicles = await this.getVehicles();
    return vehicles.find((v) => v.id === id) ?? null;
  }

  async getAvailableVehicles(category?: VehicleCategory): Promise<Vehicle[]> {
    const vehicles = await this.getVehicles();
    return vehicles.filter((v) => {
      if (v.fleetStatus !== "active") return false;
      if (category && v.category !== category) return false;
      return true;
    });
  }

  /**
   * Determina o status operacional instantâneo de um veículo.
   */
  getOperationalStatus(vehicle: Vehicle, activeRideVehicleId?: string): VehicleOperationalStatus {
    if (vehicle.fleetStatus === "maintenance") return "maintenance";
    if (activeRideVehicleId && vehicle.id === activeRideVehicleId) return "assigned";

    // Simulação suave de ocupação temporária para rovers na colônia
    if (vehicle.patrolLoop) {
      const now = Date.now();
      const cycle = SIMULATION_CONFIG.occupancyCycleMs;
      const busy = SIMULATION_CONFIG.occupancyBusyMs;
      const offset = (vehicle.patrolOffset || 0) * cycle;
      const phase = (now + offset) % cycle;
      if (phase < busy) {
        return "on_trip";
      }
    }

    return "available";
  }
}

export const vehicleService = new VehicleService();
