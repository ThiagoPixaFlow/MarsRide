/**
 * Utilitário de configuração e verificação do Supabase.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes("seu-projeto") || url.trim() === "") return false;
  if (anonKey.includes("sua-anon-key") || anonKey.trim() === "") return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isSupabaseAdminConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return isSupabaseConfigured() && Boolean(serviceKey && !serviceKey.includes("sua-service-role") && serviceKey.trim() !== "");
}

