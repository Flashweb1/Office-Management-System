import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, sendEmailVerification } from 'firebase/auth'
import { db } from '@/services/firebase'
import { auth } from '@/services/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useCompanySettings } from '@/hooks/useCompanySettings'
import { Mail, CheckCircle, XCircle, Building2 } from 'lucide-react'

export function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const { settings, saveSettings } = useCompanySettings()

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [sendingVerification, setSendingVerification] = useState(false)

  const [companyName, setCompanyName] = useState(settings.name)
  const [companyTagline, setCompanyTagline] = useState(settings.tagline)
  const [companyAddress, setCompanyAddress] = useState(settings.address)
  const [companyTaxId, setCompanyTaxId] = useState(settings.taxId)
  const [companyPhone, setCompanyPhone] = useState(settings.phone)
  const [companyEmail, setCompanyEmail] = useState(settings.email)
  const [savingCompany, setSavingCompany] = useState(false)

  useEffect(() => {
    setCompanyName(settings.name)
    setCompanyTagline(settings.tagline)
    setCompanyAddress(settings.address)
    setCompanyTaxId(settings.taxId)
    setCompanyPhone(settings.phone)
    setCompanyEmail(settings.email)
  }, [settings])

  useEffect(() => {
    if (user && !user.avatar) {
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id))
          if (userDoc.exists()) {
            const data = userDoc.data()
            if (data.phone) setPhone(data.phone)
          }
        } catch {}
      }
      fetchProfile()
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.id), { name, phone })
      setUser({ ...user, name })
      addToast('Profile updated successfully.', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      addToast('New passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'error')
      return
    }
    setChangingPassword(true)
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword)
        addToast('Password changed successfully.', 'success')
        setNewPassword('')
        setConfirmNewPassword('')
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to change password.', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleResendVerification = async () => {
    setSendingVerification(true)
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
        addToast('Verification email sent. Check your inbox.', 'success')
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to send verification email.', 'error')
    } finally {
      setSendingVerification(false)
    }
  }

  const handleSaveCompany = async () => {
    setSavingCompany(true)
    await saveSettings({
      name: companyName,
      tagline: companyTagline,
      address: companyAddress,
      taxId: companyTaxId,
      phone: companyPhone,
      email: companyEmail,
    })
    setSavingCompany(false)
  }

  if (!user) return null

  const isVerified = auth.currentUser?.emailVerified

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and company preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input value={user.email} type="email" disabled className="flex-1" />
                {isVerified ? (
                  <Badge variant="success" className="shrink-0"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                ) : (
                  <Badge variant="warning" className="shrink-0"><XCircle className="w-3 h-3 mr-1" /> Unverified</Badge>
                )}
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0000" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user.role?.replace('_', ' ') || ''} disabled />
            </div>
          </div>
          {!isVerified && (
            <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={sendingVerification}>
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              {sendingVerification ? 'Sending...' : 'Resend verification email'}
            </Button>
          )}
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company
          </CardTitle>
          <CardDescription>Your company details appear on receipts and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="LogiCommand" />
            </div>
            <div className="sm:col-span-2">
              <Label>Tagline</Label>
              <Input value={companyTagline} onChange={(e) => setCompanyTagline(e.target.value)} placeholder="Logistics Enterprise Management" />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="123 Logistics Ave, New York, NY 10001" />
            </div>
            <div>
              <Label>Tax ID / EIN</Label>
              <Input value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+1-555-0000" />
            </div>
            <div className="sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="info@logicommand.com" />
            </div>
          </div>
          <Button onClick={handleSaveCompany} disabled={savingCompany}>
            {savingCompany ? 'Saving...' : 'Save Company Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Repeat new password" required />
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive daily digest of alerts</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI Assistant</p>
              <p className="text-xs text-muted-foreground">AI chat and insights enabled</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Data Backup</p>
              <p className="text-xs text-muted-foreground">Daily automatic backup</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}