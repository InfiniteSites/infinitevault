import { supabase } from "@/integrations/supabase/client";

export type Category = { id: string; name: string; created_at: string };
export type LinkRow = { id: string; name: string; url: string; category_id: string | null; visits: number; created_at: string };
export type ProxyRow = { id: string; name: string; url: string; visits: number; created_at: string };
export type DumpRow = { id: string; title: string; created_at: string };
export type DumpLinkRow = { id: string; dump_id: string; url: string; visits: number; created_at: string };
export type Wildcard = { id: string; pattern: string; created_at: string };
export type LeaderEntry = { id: string; name: string; balance: number; updated_at: string };

export const api = {
  // Categories + links
  async getCategories() {
    const { data } = await supabase.from("categories").select("*").order("created_at");
    return (data ?? []) as Category[];
  },
  async addCategory(name: string) {
    await supabase.from("categories").insert({ name });
  },
  async deleteCategory(id: string) {
    await supabase.from("categories").delete().eq("id", id);
  },
  async getLinks() {
    const { data } = await supabase.from("links").select("*").order("created_at");
    return (data ?? []) as LinkRow[];
  },
  async addLink(name: string, url: string, category_id: string) {
    await supabase.from("links").insert({ name, url, category_id });
  },
  async deleteLink(id: string) {
    await supabase.from("links").delete().eq("id", id);
  },

  // Proxies
  async getProxies() {
    const { data } = await supabase.from("proxies").select("*").order("created_at", { ascending: false });
    return (data ?? []) as ProxyRow[];
  },
  async addProxy(name: string, url: string) {
    await supabase.from("proxies").insert({ name, url });
  },
  async deleteProxy(id: string) {
    await supabase.from("proxies").delete().eq("id", id);
  },

  // Dumps
  async getDumps() {
    const { data } = await supabase.from("dumps").select("*").order("created_at", { ascending: false });
    return (data ?? []) as DumpRow[];
  },
  async getDumpLinks() {
    const { data } = await supabase.from("dump_links").select("*").order("created_at");
    return (data ?? []) as DumpLinkRow[];
  },
  async addDump(title: string, urls: string[]) {
    const { data } = await supabase.from("dumps").insert({ title }).select().single();
    if (data && urls.length) {
      await supabase.from("dump_links").insert(urls.map((url) => ({ dump_id: data.id, url })));
    }
  },
  async deleteDump(id: string) {
    await supabase.from("dumps").delete().eq("id", id);
  },

  // Wildcards
  async getWildcards() {
    const { data } = await supabase.from("wildcards").select("*").order("created_at");
    return (data ?? []) as Wildcard[];
  },
  async addWildcard(pattern: string) {
    await supabase.from("wildcards").insert({ pattern });
  },
  async deleteWildcard(id: string) {
    await supabase.from("wildcards").delete().eq("id", id);
  },

  // Leaderboard
  async getLeaderboard() {
    const { data } = await supabase.from("leaderboard").select("*").order("balance", { ascending: false }).limit(50);
    return (data ?? []) as LeaderEntry[];
  },
  async upsertScore(name: string, balance: number) {
    // Find existing by name (case-insensitive enough for our purposes)
    const { data: existing } = await supabase.from("leaderboard").select("id").eq("name", name).maybeSingle();
    if (existing) {
      await supabase.from("leaderboard").update({ balance, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("leaderboard").insert({ name, balance });
    }
  },

  // Visits
  async bumpSite() {
    await supabase.rpc("bump_site_visits");
  },
  async bumpLink(table: "links" | "proxies" | "dump_links", id: string) {
    await supabase.rpc("bump_link_visits", { table_name: table, row_id: id });
  },
  async getStats() {
    const { data } = await supabase.from("site_stats").select("*").eq("id", 1).maybeSingle();
    return (data ?? { total_visits: 0 }) as { total_visits: number };
  },
};

export function buildProxyUrl(url: string): string {
  return `https://www.croxyproxy.com/_public/servlet/direct?url=${encodeURIComponent(url)}`;
}

// Generate random alphabetic subdomain of length 3-8
export function randomSubdomain(): string {
  const len = 3 + Math.floor(Math.random() * 6);
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function applyWildcard(pattern: string): string {
  // Replace leading "*" with a random subdomain
  if (pattern.startsWith("*.")) return `https://${randomSubdomain()}.${pattern.slice(2)}`;
  if (pattern.includes("*")) return `https://${pattern.replace("*", randomSubdomain())}`;
  return pattern.startsWith("http") ? pattern : `https://${pattern}`;
}
