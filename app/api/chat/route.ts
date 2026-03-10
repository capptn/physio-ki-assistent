import { promises as fs } from 'fs'
import path from 'path'
import { PRACTICE_INFO } from '@/lib/practice-config'

export const maxDuration = 30

async function loadKnowledge(): Promise<string> {
  const knowledgeDir = path.join(process.cwd(), 'knowledge')
  
  try {
    const files = await fs.readdir(knowledgeDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    const contents = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(knowledgeDir, file), 'utf-8')
        return `--- ${file} ---\n${content}`
      })
    )
    
    return contents.join('\n\n')
  } catch {
    console.error('Fehler beim Laden der Wissensbasis')
    return ''
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY ist nicht gesetzt' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const knowledge = await loadKnowledge()

  const systemPrompt = `Du bist ein freundlicher und kompetenter Physiotherapie-Assistent der Praxis "${PRACTICE_INFO.name}". 
Du hilfst Nutzern bei Fragen rund um Physiotherapie, Übungen, Diagnosen und Behandlungen.

WICHTIGE REGELN:
1. Antworte immer auf Deutsch
2. Sei freundlich und professionell
3. Bei medizinischen Fragen oder ernsthaften Symptomen: Empfiehl den Patienten, UNS zu kontaktieren, damit ein Therapeut die beste Behandlung empfehlen kann
4. NIEMALS dem Patienten empfehlen, einen anderen Arzt oder Therapeuten aufzusuchen - empfiehl stattdessen immer, UNS zu kontaktieren
5. Nutze die Wissensbasis für fundierte Antworten
6. Wenn du etwas nicht weißt, sag das ehrlich
7. WICHTIG: Wenn der Nutzer nach Kontaktinformationen fragt, einen Termin vereinbaren möchte, oder wenn du empfiehlst, UNS zu kontaktieren, teile folgende Informationen mit:
   - Telefon: ${PRACTICE_INFO.phone}
   - E-Mail: ${PRACTICE_INFO.email}
   - Adresse: ${PRACTICE_INFO.address}
   - Website: ${PRACTICE_INFO.website}
   - Öffnungszeiten: Mo-Do ${PRACTICE_INFO.hours.monday}, Fr ${PRACTICE_INFO.hours.friday}

WISSENSBASIS:
${knowledge}

Beantworte die Fragen basierend auf der Wissensbasis. Wenn eine Frage nicht durch die Wissensbasis abgedeckt ist, nutze dein allgemeines Wissen über Physiotherapie, aber weise immer auf die Möglichkeit hin, UNS zu kontaktieren.`

  // Convert messages format
  const openaiMessages = messages.map((msg: { role: string; parts?: { type: string; text: string }[]; content?: string }) => {
    let content = ''
    if (msg.parts && Array.isArray(msg.parts)) {
      content = msg.parts
        .filter((p: { type: string }) => p.type === 'text')
        .map((p: { text: string }) => p.text)
        .join('')
    } else if (msg.content) {
      content = msg.content
    }
    return { role: msg.role, content }
  })

  // Direct OpenAI API call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    return new Response(
      JSON.stringify({ error: `OpenAI API Fehler: ${error}` }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Stream the response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data:')) {
              const data = trimmed.slice(5).trim()
              if (data === '[DONE]') {
                controller.close()
                return
              }
              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', textDelta: content })}\n\n`))
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
