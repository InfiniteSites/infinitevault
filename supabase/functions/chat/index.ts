import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { messages } = await req.json()
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        stream: true,
        messages: messages.map((m: any) => ({ role: m.role, content: String(m.content ?? '') })),
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text()
      const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 500
      const msg = upstream.status === 429 ? 'Rate limit, try again in a moment.' : upstream.status === 402 ? 'AI credits exhausted. Add credits in Settings.' : t
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Transform OpenAI-style SSE chunks into { text } chunks
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
              if (!json || json === '[DONE]') continue
              try {
                const obj = JSON.parse(json)
                const text = obj?.choices?.[0]?.delta?.content ?? ''
                if (text) controller.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`))
              } catch {}
            }
          }
          controller.enqueue(enc.encode('data: [DONE]\n\n'))
        } catch (e) { controller.error(e) }
        finally { controller.close() }
      },
    })

    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
