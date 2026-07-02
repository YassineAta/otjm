import { describe, expect, it } from 'vitest'
import { canDeleteAdmin, generateTempPassword } from '@/lib/admin-accounts'

describe('generateTempPassword', () => {
  it('respecte le format xxxxx-xxxxx-xxxxx', () => {
    expect(generateTempPassword()).toMatch(/^[a-zA-Z2-9]{5}-[a-zA-Z2-9]{5}-[a-zA-Z2-9]{5}$/)
  })

  it('dépasse le minimum de 12 caractères exigé au login', () => {
    expect(generateTempPassword().length).toBeGreaterThanOrEqual(12)
  })

  it('exclut les caractères ambigus (0/O, 1/l/I, i, o, L)', () => {
    for (let n = 0; n < 20; n++) {
      expect(generateTempPassword()).not.toMatch(/[01OIloiL]/)
    }
  })

  it('ne produit jamais deux fois le même mot de passe', () => {
    const seen = new Set(Array.from({ length: 100 }, () => generateTempPassword()))
    expect(seen.size).toBe(100)
  })
})

describe('canDeleteAdmin', () => {
  const actor = 'superadmin@otjm.tn'

  it('bloque la suppression de tout compte superadmin', () => {
    expect(canDeleteAdmin(actor, { email: 'autre@otjm.tn', role: 'superadmin' })).toMatch(
      /superadmin/i,
    )
  })

  it('bloque la suppression de son propre compte', () => {
    expect(canDeleteAdmin(actor, { email: actor, role: 'admin' })).toMatch(/propre compte/i)
  })

  it('permet la suppression d’un autre compte admin', () => {
    expect(canDeleteAdmin(actor, { email: 'membre-bureau@otjm.tn', role: 'admin' })).toBeNull()
  })
})
