import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, profissional, studio, loading, signIn, signOut } = useAuthStore()

  const isDona = profissional?.role === 'dona'
  const isAjudante = profissional?.role === 'ajudante'

  return { user, profissional, studio, loading, signIn, signOut, isDona, isAjudante }
}
