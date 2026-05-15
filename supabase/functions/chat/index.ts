import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { messages } = await req.json()
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content ?? '') }],
    }))

    // Gemini streaming endpoint (SSE-style alt=sse)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })

    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text()
      return new Response(JSON.stringify({ error: 'Gemini error', detail: t }), { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Pipe SSE through, transforming into simple "data: {text}\n\n" lines
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader()
        const dec = new TextDecoder()
        const enc = new TextEncoder()
        let buf = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            let idx
            while ((idx = buf.indexOf('\n')) !== -1) {
              const line = buf.slice(0, idx).trim()
              buf = buf.slice(idx + 1)
              if (!line.startsWith('data:')) continue
              const json = line.slice(5).trim()
              if (!json) continue
              try {
                const obj = JSON.parse(json)
                const text = obj?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? ''
                if (text) controller.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`))
              } catch {}
            }
          }
          controller.enqueue(enc.encode('data: [DONE]\n\n'))
        } catch (e) {
          controller.error(e)
        } finally { controller.close() }
      },
    })

    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
