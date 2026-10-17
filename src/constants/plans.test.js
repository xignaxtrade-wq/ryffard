import { describe, expect, it } from 'vitest'
import { PLANS } from './index'

describe('plan names and limits', () => {
  it('keeps the existing database identifier with the public Gratis name', () => {
    expect(PLANS.find(plan => plan.id === 'demo')).toMatchObject({
      label: 'Gratis', maxTickets: 50, maxRifas: 1,
    })
  })
})
