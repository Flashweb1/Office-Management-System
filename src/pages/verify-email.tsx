import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Mail, RefreshCw } from 'lucide-react'

export function VerifyEmailPage() {
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const { sendVerificationEmail, isMock, logout } = useAuth()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleResend = async () => {
    setSending(true)
    setMessage('')
    try {
      await sendVerificationEmail()
      setMessage('Verification email sent!')
    } catch {
      setMessage('Failed to send. Try again.')
    } finally {
      setSending(false)
    }
  }

  const handleCheckVerification = () => {
    if (isMock) {
      navigate('/dashboard')
      return
    }
    setChecking(true)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.emailVerified) {
        unsubscribe()
        setChecking(false)
        navigate('/dashboard')
      } else {
        unsubscribe()
        setChecking(false)
        setMessage('Email not yet verified. Check your inbox and try again.')
      }
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We sent a verification email to <strong>{user?.email}</strong>.
            Click the link in the email to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMock && (
            <p className="text-sm text-center text-muted-foreground">
              Preview mode — click "I've verified" to continue.
            </p>
          )}

          <Button className="w-full" onClick={handleCheckVerification} disabled={checking}>
            {checking ? 'Checking...' : "I've verified my email"}
            {checking && <RefreshCw className="w-4 h-4 ml-2 animate-spin" />}
          </Button>

          <Button variant="outline" className="w-full" onClick={handleResend} disabled={sending}>
            {sending ? 'Sending...' : 'Resend verification email'}
          </Button>

          {message && (
            <p className="text-sm text-center text-muted-foreground">{message}</p>
          )}

          <p className="text-sm text-center text-muted-foreground">
            Wrong email?{' '}
            <button onClick={handleLogout} className="text-primary underline-offset-4 hover:underline bg-transparent border-none cursor-pointer text-sm">
              Sign out
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}