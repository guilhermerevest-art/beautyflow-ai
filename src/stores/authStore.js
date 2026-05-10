import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profissional: null,
  studio: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get().loadProfissional(session.user)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await get().loadProfissional(session.user)
      } else {
        set({ user: null, profissional: null, studio: null })
      }
    })
  },

  loadProfissional: async (user) => {
    try {
      const { data: prof, error } = await supabase
        .from('estudoEstetica_profissional')
        .select('*, estudoEstetica_studio(*)')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      set({
        user,
        profissional: prof,
        studio: prof.estudoEstetica_studio,
      })
    } catch (err) {
set({ user: null, profissional: null, studio: null })
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await get().loadProfissional(data.user)
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profissional: null, studio: null })
  },
}))
