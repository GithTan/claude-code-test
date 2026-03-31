import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('supabase client', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('has auth property', () => {
    expect(supabase.auth).toBeDefined()
  })
})
