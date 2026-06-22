import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Package, Truck, BarChart3, Bot, ArrowRight, Shield, Zap, Users } from 'lucide-react'

const features = [
  { icon: Package, title: 'Shipment Tracking', desc: 'Real-time visibility across every lane. Monitor status, costs, and margins from a single dashboard.' },
  { icon: Truck, title: 'Fleet Management', desc: 'Manage drivers, trucks, and maintenance schedules. Know who\'s available, on-trip, or off-duty.' },
  { icon: BarChart3, title: 'Financial Analytics', desc: 'P&L reports, AR aging, profit by customer and lane. Make data-driven pricing decisions.' },
  { icon: Bot, title: 'AI Assistant', desc: 'Ask questions in plain English. Get instant insights on margins, delays, and performance.' },
]

const stats = [
  { icon: Zap, value: '99.9%', label: 'Uptime' },
  { icon: Shield, value: '10k+', label: 'Shipments Tracked' },
  { icon: Users, value: '500+', label: 'Active Users' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Package className="w-5 h-5 text-primary" />
            LogiCommand
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          Logistics Intelligence,<br />
          <span className="text-primary">Simplified.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-lg">
          Track shipments, manage your fleet, analyze finances — all in one place.
          Your logistics command center.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Button size="lg" onClick={() => navigate('/signup')}>
            Get Started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </section>

      <section className="border-t py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="border rounded-lg p-5 text-left">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-around">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <s.icon className="w-5 h-5 text-primary" />
                {s.value}
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} LogiCommand. All rights reserved.</p>
      </footer>
    </div>
  )
}
