import { mockStorage } from "@/mocks/storage";
import { UserProfile, TravelPreferences, UserStats } from "@/modules/users/user.types";
import { ServiceError } from "@/lib/errors";
import { simulateLatency } from "@/lib/latency";

export class UserService {
  async getProfile(userId?: string): Promise<UserProfile> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    if (!id) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");

    const account = mockStorage.getUserById(id);
    if (!account) throw new ServiceError("NOT_FOUND", "Perfil não encontrado.");

    return account.profile;
  }

  async updateProfile(
    updates: Partial<Pick<UserProfile, "name" | "username" | "occupation" | "avatarColor" | "homeLocationId">>
  ): Promise<UserProfile> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    await simulateLatency(150, 350);
    mockStorage.init();
    const id = mockStorage.getCurrentUserId();
    if (!id) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");

    const account = mockStorage.getUserById(id);
    if (!account) throw new ServiceError("NOT_FOUND", "Perfil não encontrado.");

    const updatedProfile: UserProfile = {
      ...account.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    account.profile = updatedProfile;
    account.name = updatedProfile.name;
    account.username = updatedProfile.username;

    mockStorage.saveUser(account);
    return updatedProfile;
  }

  async updatePreferences(preferences: Partial<TravelPreferences>): Promise<TravelPreferences> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.preferences) {
            return json.data.preferences;
          }
        }
      }
    } catch {
      // Fallback
    }

    await simulateLatency(150, 300);
    mockStorage.init();
    const id = mockStorage.getCurrentUserId();
    if (!id) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");

    const account = mockStorage.getUserById(id);
    if (!account) throw new ServiceError("NOT_FOUND", "Perfil não encontrado.");

    const updatedPreferences: TravelPreferences = {
      ...account.profile.preferences,
      ...preferences,
    };

    account.profile.preferences = updatedPreferences;
    account.profile.updatedAt = new Date().toISOString();

    mockStorage.saveUser(account);
    return updatedPreferences;
  }

  async getUserStats(userId?: string): Promise<UserStats> {
    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    const rides = mockStorage.getRides().filter((r) => r.userId === id && r.status === "completed");

    const completedRides = rides.length;
    const totalDistanceKm = Number(
      rides.reduce((acc, r) => acc + (r.estimatedDistanceKm || 0), 0).toFixed(1)
    );
    const totalSpent = rides.reduce((acc, r) => acc + (r.finalPrice ?? r.estimatedPrice), 0);

    return {
      completedRides,
      totalDistanceKm,
      totalSpent,
    };
  }
}

export const userService = new UserService();
