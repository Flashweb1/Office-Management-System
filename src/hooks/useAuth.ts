import { useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import { useAuthStore } from '@/store/authStore'
import { MOCK_USER, MOCK_USERS } from '@/lib/mock-auth'
import type { User } from '@/types'

const isMock = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key'

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clearUser } = useAuthStore()

  useEffect(() => {
    if (isMock) {
      setUser(MOCK_USER)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>
          setUser({ id: firebaseUser.uid, ...userData })
        } else {
          clearUser()
        }
      } else {
        clearUser()
      }
    })
    return unsubscribe
  }, [setUser, setLoading, clearUser])

  const login = async (email: string, password: string) => {
    if (isMock) {
      const mockAccount = MOCK_USERS[email]
      if (!mockAccount || mockAccount.password !== password) {
        throw new Error('Invalid email or password. Try ceo@logicommand.com / password123')
      }
      setUser(mockAccount.user)
      return
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    if (isMock) {
      clearUser()
      return
    }
    await signOut(auth)
    clearUser()
  }

  return { user, isLoading, login, logout }
}
