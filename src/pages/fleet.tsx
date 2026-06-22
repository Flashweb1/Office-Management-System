import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useCollection } from '@/hooks/useFirestore'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import type { Driver, Truck } from '@/types'

export function FleetPage() {
  const { data: drivers, isLoading: driversLoading } = useCollection<Driver>('drivers')
  const { data: trucks, isLoading: trucksLoading } = useCollection<Truck>('trucks')

  const availableDrivers = (drivers || []).filter(d => d.status === 'available').length

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet Management" description="Manage drivers and trucks." />

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Total Drivers" value={String(drivers?.length || 0)} />
        <StatCard title="Available" value={String(availableDrivers)} variant="success" />
        <StatCard title="On Trip" value={String((drivers || []).filter(d => d.status === 'on_trip').length)} variant="warning" />
        <StatCard title="Total Trucks" value={String(trucks?.length || 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drivers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {driversLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(drivers || []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No drivers added yet.</TableCell></TableRow>
                ) : (drivers || []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.licenseNo || '-'}</TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell>{d.truckId || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === 'available' ? 'success' : d.status === 'on_trip' ? 'warning' : 'default'}>
                        {d.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trucks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trucksLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(trucks || []).length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No trucks added yet.</TableCell></TableRow>
                ) : (trucks || []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.plateNumber}</TableCell>
                    <TableCell>{t.model || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'active' ? 'success' : t.status === 'maintenance' ? 'danger' : 'default'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
