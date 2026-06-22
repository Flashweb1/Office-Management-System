import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function SettingsPage() {
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
              <Input defaultValue="CEO User" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue="ceo@logicommand.com" type="email" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input defaultValue="+1-555-0001" />
            </div>
            <div>
              <Label>Role</Label>
              <Input defaultValue="CEO" disabled />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company</CardTitle>
          <CardDescription>Your logistics company details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Company Name</Label>
              <Input defaultValue="LogiCommand Logistics" />
            </div>
            <div>
              <Label>Tax ID / EIN</Label>
              <Input defaultValue="XX-XXXXXXX" />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input defaultValue="123 Logistics Ave, Suite 100, New York, NY 10001" />
            </div>
          </div>
          <Button>Save Changes</Button>
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
