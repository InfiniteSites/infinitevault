import { supabase } from "@/integrations/supabase/client";

export type Category = { id: string; name: string; created_at: string };
export type LinkRow = { id: string; name: string; url: string; category_id: string | null; visits: number; created_at: string; blockers: string[]; last_status: string | null; last_checked: string | null };
export type ProxyRow = { id: string; name: string; url: string; visits: number; created_at: string; blockers: string[]; last_status: string | null; last_checked: string | null };
export type DumpRow = { id: string; title: string; created_at: string };
export type DumpLinkRow = { id: string; dump_id: string; url: string; visits: number; created_at: string };
export type Wildcard = { id: string; pattern: string; created_at: string };
export type LeaderEntry = { id: string; name: string; balance: number; updated_at: string };
export type Announcement = { id: string; author: string; message: string; created_at: string };

// Fetch all rows from a table by paginating past the 1000-row default
async function fetchAll<T>(table: string, order = "created_at"): Promise<T[]> {
  const PAGE = 1000;
  let from = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await supabase.from(table as any).select("*").order(order).range(from, from + PAGE - 1);
    if (error || !data) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export const api = {
  async getCategories() { return fetchAll<Category>("categories"); },
  async addCategory(name: string) { await supabase.from("categories").insert({ name }); },
  async deleteCategory(id: string) { await supabase.from("categories").delete().eq("id", id); },

  async getLinks() { return fetchAll<LinkRow>("links"); },
  async addLink(name: string, url: string, category_id: string, blockers: string[] = []) {
    await supabase.from("links").insert({ name, url, category_id, blockers });
  },
  async updateLinkBlockers(id: string, blockers: string[]) {
    await supabase.from("links").update({ blockers }).eq("id", id);
  },
  async deleteLink(id: string) { await supabase.from("links").delete().eq("id", id); },

  async getProxies() { return fetchAll<ProxyRow>("proxies"); },
  async addProxy(name: string, url: string, blockers: string[] = []) {
    await supabase.from("proxies").insert({ name, url, blockers });
  },
  async updateProxyBlockers(id: string, blockers: string[]) {
    await supabase.from("proxies").update({ blockers }).eq("id", id);
  },
  async deleteProxy(id: string) { await supabase.from("proxies").delete().eq("id", id); },

  async getDumps() { return fetchAll<DumpRow>("dumps"); },
  async getDumpLinks() { return fetchAll<DumpLinkRow>("dump_links"); },
  async addDump(title: string, urls: string[]) {
    const { data } = await supabase.from("dumps").insert({ title }).select().single();
    if (data && urls.length) {
      // Insert in batches of 500 to avoid payload limits
      const BATCH = 500;
      for (let i = 0; i < urls.length; i += BATCH) {
        const slice = urls.slice(i, i + BATCH);
        await supabase.from("dump_links").insert(slice.map((url) => ({ dump_id: data.id, url })));
      }
    }
  },
  async deleteDump(id: string) { await supabase.from("dumps").delete().eq("id", id); },

  async getWildcards() { return fetchAll<Wildcard>("wildcards"); },
  async addWildcard(pattern: string) { await supabase.from("wildcards").insert({ pattern }); },
  async deleteWildcard(id: string) { await supabase.from("wildcards").delete().eq("id", id); },

  async getLeaderboard() {
    const { data } = await supabase.from("leaderboard").select("*").order("balance", { ascending: false }).limit(50);
    return (data ?? []) as LeaderEntry[];
  },
  async upsertScore(name: string, balance: number) {
    const { data: existing } = await supabase.from("leaderboard").select("id").eq("name", name).maybeSingle();
    if (existing) await supabase.from("leaderboard").update({ balance, updated_at: new Date().toISOString() }).eq("id", existing.id);
    else await supabase.from("leaderboard").insert({ name, balance });
  },

  async bumpSite() { await supabase.rpc("bump_site_visits"); },

  async getAnnouncements() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(200);
    return (data ?? []) as Announcement[];
  },
  async addAnnouncement(author: string, message: string) {
    await supabase.from("announcements").insert({ author, message });
  },
  async deleteAnnouncement(id: string) { await supabase.from("announcements").delete().eq("id", id); },

  async bumpLink(table: "links" | "proxies" | "dump_links", id: string) {
    await supabase.rpc("bump_link_visits", { table_name: table, row_id: id });
  },
  async getStats() {
    const { data } = await supabase.from("site_stats").select("*").eq("id", 1).maybeSingle();
    return (data ?? { total_visits: 0 }) as { total_visits: number };
  },

  async checkAll() { await supabase.functions.invoke("check-link", { body: { mode: "all" } }); },
  async checkOne(url: string): Promise<"working" | "down"> {
    const { data } = await supabase.functions.invoke("check-link", { body: { mode: "one", url } });
    return (data as any)?.status ?? "down";
  },
};

export function buildProxyUrl(url: string): string {
  return `https://www.croxyproxy.com/_public/servlet/direct?url=${encodeURIComponent(url)}`;
}

export function randomSubdomain(): string {
  const len = 3 + Math.floor(Math.random() * 6);
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function applyWildcard(pattern: string): string {
  if (pattern.startsWith("*.")) return `https://${randomSubdomain()}.${pattern.slice(2)}`;
  if (pattern.includes("*")) return `https://${pattern.replace("*", randomSubdomain())}`;
  return pattern.startsWith("http") ? pattern : `https://${pattern}`;
}
