import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Función serverless de Vercel: recibe el cuadre calculado en el cliente
// y devuelve un análisis generado por Claude.
// Requiere la variable de entorno ANTHROPIC_API_KEY configurada en Vercel.

const SYSTEM_PROMPT = `Eres un contador experto en cuadre de caja para rifas digitales en República Dominicana.
Recibirás un JSON con el cuadre de las rifas de un organizador: totales, desglose por rifa, desglose por método de pago y discrepancias detectadas.

Genera un informe de cuadre en español, claro y directo, con este formato:

## Resumen del Cuadre
(2-3 oraciones: cuánto se ha recaudado, cuánto está pendiente por confirmar, estado general)

## Estado por Rifa
(una línea por rifa: nombre, % vendido, recaudado confirmado, pendiente)

## Cuadre por Método de Pago
(totales confirmados por cada método; señala si hay tickets pagados sin método registrado)

## Alertas y Discrepancias
(lista cada discrepancia con su impacto en RD$ y qué hacer para corregirla; si no hay, dilo)

## Recomendaciones
(2-4 acciones concretas priorizadas: confirmar reservas por vencer, corregir contadores, liberar números, etc.)

Usa montos en formato RD$X,XXX. Sé específico con números y nombres de rifas. No inventes datos que no estén en el JSON.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada en el servidor' })
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'La autenticación del servidor no está configurada' })
  }

  const authorization = req.headers.authorization || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) return res.status(401).json({ error: 'Sesión requerida' })

  const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken)
  if (authError || !user) return res.status(401).json({ error: 'Sesión inválida o vencida' })

  const { cuadre } = req.body || {}
  if (!cuadre || !Array.isArray(cuadre.rifas)) {
    return res.status(400).json({ error: 'Falta el objeto cuadre con sus rifas' })
  }

  const client = new Anthropic()

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Fecha del cuadre: ${new Date().toISOString()}\n\nDatos del cuadre:\n${JSON.stringify(cuadre, null, 2)}`,
        },
      ],
    })

    const analysis = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return res.status(200).json({ analysis })
  } catch (err) {
    console.error('Error en cuadre IA:', err)
    return res.status(500).json({ error: err.message || 'Error generando el análisis' })
  }
}
