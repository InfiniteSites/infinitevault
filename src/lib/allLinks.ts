export interface AnyLink {
  name: string;
  url: string;
  source: string; // category name, "More Proxies", or dump title
  type: "category" | "proxy" | "dump";
}

interface Cat { id: string; name: string; links: { name: string; url: string }[] }
interface ProxyL { name: string; url: string }
interface Dump { id: string; title: string; links: string[]; createdAt: number }

export function getAllLinks(): AnyLink[] {
  const out: AnyLink[] = [];
  try {
    const cats: Cat[] = JSON.parse(localStorage.getItem("iv_categories") || "[]");
    cats.forEach((c) => c.links.forEach((l) => out.push({ ...l, source: c.name, type: "category" })));
  } catch {}
  try {
    const proxies: ProxyL[] = JSON.parse(localStorage.getItem("iv_proxies") || "[]");
    proxies.forEach((l) => out.push({ ...l, source: "More Proxies", type: "proxy" }));
  } catch {}
  try {
    const dumps: Dump[] = JSON.parse(localStorage.getItem("iv_dumps") || "[]");
    dumps.forEach((d) => d.links.forEach((url) => out.push({ name: url, url, source: d.title, type: "dump" })));
  } catch {}
  return out;
}
