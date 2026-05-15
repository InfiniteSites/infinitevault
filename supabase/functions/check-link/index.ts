import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function probe(url: string): Promise<'working' | 'down'> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    let r: Response
    try {
      r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal })
      if (r.status === 405 || r.status === 501) {
        r = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal })
      }
    } finally { clearTimeout(t) }
    return r.status < 500 ? 'working' : 'down'
  } catch { return 'down' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({}))
    const mode = body?.mode ?? 'all'
    const now = new Date().toISOString()

    if (mode === 'one') {
      const url = String(body.url ?? '')
      if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const status = await probe(url)
      return new Response(JSON.stringify({ status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const [{ data: links }, { data: prox }] = await Promise.all([
      supabase.from('links').select('id,url'),
      supabase.from('proxies').select('id,url'),
    ])
    const work: { table: 'links' | 'proxies'; id: string; url: string }[] = [
      ...(links ?? []).map((r: any) => ({ table: 'links' as const, id: r.id, url: r.url })),
      ...(prox ?? []).map((r: any) => ({ table: 'proxies' as const, id: r.id, url: r.url })),
    ]
    // limit concurrency
    const CONCURRENCY = 12
    let i = 0
    async function worker() {
      while (i < work.length) {
        const item = work[i++]
        const status = await probe(item.url)
        await supabase.from(item.table).update({ last_status: status, last_checked: now }).eq('id', item.id)
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    return new Response(JSON.stringify({ checked: work.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
