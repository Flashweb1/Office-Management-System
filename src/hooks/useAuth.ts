import { useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { getMockUsers, addMockUser } from '@/lib/mock-auth'
import type { User } from '@/types'

const isMock = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Contact support.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Popup was blocked by your browser. Allow popups for this site.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
}

function getFriendlyError(error: any): string {
  if (error?.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code]
  }
  if (error?.message) {
    const msg = error.message
    if (msg.includes('Firebase: ')) {
      const match = msg.match(/Firebase:\s*(.+?)\s*\(auth\//)
      if (match) return match[1]
    }
    return msg
  }
  return 'Something went wrong. Please try again.'
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clearUser } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    if (isMock) {
      setUser(getMockUsers()['ceo@logicommand.com']?.user || null)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>
          setUser({ id: firebaseUser.uid, ...userData })
        } else {
          const newUser: Omit<User, 'id'> = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: 'PENDING',
          }
          await setDoc(userRef, newUser)
          setUser({ id: firebaseUser.uid, ...newUser })
        }
      } else {
        clearUser()
      }
    })
    return unsubscribe
  }, [setUser, setLoading, clearUser])

  const login = async (email: string, password: string) => {
    if (isMock) {
      const users = getMockUsers()
      const mockAccount = users[email]
      if (!mockAccount || mockAccount.password !== password) {
        throw new Error('Invalid email or password. Try ceo@logicommand.com / password123')
      }
      setUser(mockAccount.user)
      return
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signup = async (email: string, password: string, name: string) => {
    if (isMock) {
      const users = getMockUsers()
      if (users[email]) {
        throw new Error('This email is already registered. Try signing in instead.')
      }
      if (password.length < 6) {
        throw new Error('Password should be at least 6 characters.')
      }
      const newUser = addMockUser(name, email, password)
      setUser(newUser)
      addToast('Account created successfully!', 'success')
      return
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', credential.user.uid), {
      name,
      email,
      role: 'PENDING',
    })
    if (credential.user) {
      await sendEmailVerification(credential.user)
    }
    addToast('Account created! Check your email for verification.', 'success')
  }

  const signInWithGoogle = async () => {
    if (isMock) {
      addToast('Google sign-in is not available in preview mode.', 'warning')
      return
    }
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    if (isMock) {
      clearUser()
      return
    }
    await signOut(auth)
    clearUser()
  }

  const sendPasswordReset = async (email: string) => {
    if (isMock) {
      addToast('Password reset email sent (preview mode).', 'success')
      return
    }
    await sendPasswordResetEmail(auth, email)
    addToast('Password reset email sent. Check your inbox.', 'success')
  }

  const sendVerificationEmail = async () => {
    if (isMock) {
      addToast('Verification email sent (preview mode).', 'success')
      return
    }
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
      addToast('Verification email sent. Check your inbox.', 'success')
    }
  }

  const handleError = (error: any): string => {
    const msg = getFriendlyError(error)
    addToast(msg, 'error')
    return msg
  }

  return {
    user,
    isLoading,
    isMock,
    login,
    signup,
    signInWithGoogle,
    logout,
    sendPasswordReset,
    sendVerificationEmail,
    handleError,
  }
}