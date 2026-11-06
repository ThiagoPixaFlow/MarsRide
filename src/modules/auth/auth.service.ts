import { mockStorage, StoredUserAccount } from "@/mocks/storage";
import { UserProfile, DEFAULT_PREFERENCES, AVATAR_COLORS, TravelPreferences } from "@/modules/users/user.types";
import { ServiceError } from "@/lib/errors";
import { simulateLatency } from "@/lib/latency";
import { createId } from "@/lib/id";
import { pickRandom } from "@/lib/random";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface LoginParams {
  email: string;
  password?: string;
}

export interface RegisterParams {
  name: string;
  username: string;
  email: string;
  password?: string;
}

export class AuthService {
  async login(params: LoginParams): Promise<UserProfile> {
    const email = params.email.trim().toLowerCase();
    const isDemo = email === "alex@redride.mars";
    const password = params.password || (isDemo ? "demo123" : undefined);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new ServiceError("UNAUTHENTICATED", error.message || "Credenciais inválidas.");
        }

        if (data.user) {
          // Busca o perfil correspondente
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle();

          const resolvedProfile: UserProfile = profile
            ? {
                id: profile.id,
                name: profile.name,
                username: profile.username ?? email.split("@")[0],
                email: data.user.email ?? profile.email ?? "",
                avatarColor: profile.avatar_color ?? "#e2602c",
                occupation: profile.occupation ?? "Colono Pioneiro",
                homeLocationId: profile.home_location_id ?? "loc-residential",
                preferences: (profile.preferences as unknown as TravelPreferences) ?? { ...DEFAULT_PREFERENCES },
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              }
            : {
                id: data.user.id,
                name: (data.user.user_metadata?.name as string) || "Colono de Marte",
                username: (data.user.user_metadata?.username as string) || email.split("@")[0],
                email: data.user.email ?? email,
                avatarColor: "#e2602c",
                occupation: "Colono Pioneiro",
                homeLocationId: "loc-residential",
                preferences: { ...DEFAULT_PREFERENCES },
                createdAt: data.user.created_at,
                updatedAt: data.user.created_at,
              };

          mockStorage.init();
          mockStorage.setCurrentUserId(resolvedProfile.id);
          return resolvedProfile;
        }
      }
    }

    // Modo local / demo
    await simulateLatency(200, 450);
    mockStorage.init();

    const user = mockStorage.getUserByEmail(params.email);
    if (!user) {
      throw new ServiceError("NOT_FOUND", "Nenhum colono encontrado com este e-mail.");
    }

    mockStorage.setCurrentUserId(user.id);
    return user.profile;
  }

  async register(params: RegisterParams): Promise<UserProfile> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase && params.password) {
        const { data, error } = await supabase.auth.signUp({
          email: params.email.trim().toLowerCase(),
          password: params.password,
          options: {
            data: {
              name: params.name.trim(),
              username: params.username.trim().toLowerCase(),
            },
          },
        });

        if (error) {
          throw new ServiceError("CONFLICT", error.message || "Falha ao registrar colono.");
        }

        if (data.user) {
          if (!data.session) {
            try {
              await supabase.auth.signInWithPassword({
                email: params.email.trim().toLowerCase(),
                password: params.password,
              });
            } catch {
              // Confirmação de e-mail pode ser exigida pelo provedor
            }
          }

          const now = new Date().toISOString();
          const newProfile: UserProfile = {
            id: data.user.id,
            name: params.name.trim(),
            username: params.username.trim().toLowerCase(),
            email: params.email.trim().toLowerCase(),
            avatarColor: pickRandom(AVATAR_COLORS) ?? "#e2602c",
            occupation: "Colono Pioneiro",
            homeLocationId: "loc-residential",
            preferences: { ...DEFAULT_PREFERENCES },
            createdAt: now,
            updatedAt: now,
          };
          mockStorage.init();
          mockStorage.setCurrentUserId(newProfile.id);
          return newProfile;
        }
      }
    }

    // Modo local / demo
    await simulateLatency(250, 500);
    mockStorage.init();

    const existing = mockStorage.getUserByEmail(params.email);
    if (existing) {
      throw new ServiceError("CONFLICT", "Este e-mail já está cadastrado na colônia.");
    }

    const userId = createId("usr");
    const now = new Date().toISOString();

    const profile: UserProfile = {
      id: userId,
      name: params.name.trim(),
      username: params.username.trim().toLowerCase(),
      email: params.email.trim().toLowerCase(),
      avatarColor: pickRandom(AVATAR_COLORS) ?? "#e2602c",
      occupation: "Colono Pioneiro",
      homeLocationId: "loc-residential",
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: now,
      updatedAt: now,
    };

    const newAccount: StoredUserAccount = {
      id: userId,
      name: profile.name,
      username: profile.username,
      email: profile.email,
      passwordHash: "demo_hash",
      profile,
    };

    mockStorage.saveUser(newAccount);
    mockStorage.getWalletByUserId(userId);
    mockStorage.setCurrentUserId(userId);

    return profile;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            mockStorage.init();
            mockStorage.setCurrentUserId(profile.id);
            return {
              id: profile.id,
              name: profile.name,
              username: profile.username ?? user.email?.split("@")[0] ?? "colono",
              email: user.email ?? profile.email ?? "",
              avatarColor: profile.avatar_color ?? "#e2602c",
              occupation: profile.occupation ?? "Colono Pioneiro",
              homeLocationId: profile.home_location_id ?? "loc-residential",
              preferences: (profile.preferences as unknown as TravelPreferences) ?? { ...DEFAULT_PREFERENCES },
              createdAt: profile.created_at,
              updatedAt: profile.updated_at,
            };
          }

          const fallbackProfile: UserProfile = {
            id: user.id,
            name: (user.user_metadata?.name as string) || "Colono de Marte",
            username: (user.user_metadata?.username as string) || user.email?.split("@")[0] || "colono",
            email: user.email ?? "",
            avatarColor: "#e2602c",
            occupation: "Colono Pioneiro",
            homeLocationId: "loc-residential",
            preferences: { ...DEFAULT_PREFERENCES },
            createdAt: user.created_at,
            updatedAt: user.created_at,
          };
          mockStorage.init();
          mockStorage.setCurrentUserId(fallbackProfile.id);
          return fallbackProfile;
        }
      }
    }

    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId();
    if (!currentId) return null;
    const account = mockStorage.getUserById(currentId);
    return account ? account.profile : null;
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    await simulateLatency(100, 200);
    mockStorage.setCurrentUserId(null);
  }
}

export const authService = new AuthService();
