import { describe, expect, it, vi } from 'vitest'
import { computeCuadre } from './CuadreIA'

describe('computeCuadre', () => {
  it('calcula montos y discrepancias por rifa', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-18T12:00:00Z'))

    const result = computeCuadre(
      [{ id: 'r1', name: 'Rifa Uno', status: 'active', price: 150, total: 100, sold: 2 }],
      [
        { rifa_id: 'r1', status: 'paid', payment_method: 'Banco' },
        { rifa_id: 'r1', status: 'reserved', expires_at: '2026-07-17T12:00:00Z' },
      ],
    )

    expect(result.totales.recaudado_confirmado).toBe(150)
    expect(result.totales.pendiente_por_confirmar).toBe(150)
    expect(result.por_metodo.Banco).toEqual({ tickets: 1, monto: 150 })
    expect(result.discrepancias.map(item => item.tipo)).toEqual([
      'contador_desincronizado',
      'reservas_vencidas',
    ])
    vi.useRealTimers()
  })

  it('reporta pagos sin método', () => {
    const result = computeCuadre(
      [{ id: 'r1', name: 'Rifa', status: 'active', price: 100, total: 10, sold: 1 }],
      [{ rifa_id: 'r1', status: 'paid', payment_method: null }],
    )

    expect(result.rifas[0].pagados_sin_metodo).toBe(1)
    expect(result.por_metodo['Sin método registrado'].monto).toBe(100)
  })
})
