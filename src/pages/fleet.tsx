import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DriverForm } from '@/components/forms/driver-form'
import { TruckForm } from '@/components/forms/truck-form'
import { TableSkeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { useCollection } from '@/hooks/useFirestore'
import { useFirestoreMutation } from '@/hooks/useFirestoreMutation'
import { MoreHorizontal, Edit3, Trash2, Plus, Truck } from 'lucide-react'
import type { Driver, Truck as TruckType } from '@/types'

export function FleetPage() {
  const { data: drivers, isLoading: driversLoading } = useCollection<Driver>('drivers')
  const { data: trucks, isLoading: trucksLoading } = useCollection<TruckType>('trucks')

  const { add: addDriver, update: updateDriver, remove: removeDriver } = useFirestoreMutation<Driver>('drivers')
  const { add: addTruck, update: updateTruck, remove: removeTruck } = useFirestoreMutation<TruckType>('trucks')

  const [showDriverForm, setShowDriverForm] = useState(false)
  const [showTruckForm, setShowTruckForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null)
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null)
  const [deleteTruck, setDeleteTruck] = useState<TruckType | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const availableDrivers = (drivers || []).filter(d => d.status === 'available').length

  const handleAddDriver = (data: any) => {
    addDriver({
      name: data.name,
      phone: data.phone,
      licenseNo: data.licenseNo || '',
      truckId: data.truckId || '',
      status: data.status,
    })
    setShowDriverForm(false)
  }

  const handleEditDriver = (data: any) => {
    if (!editingDriver) return
    updateDriver({
      id: editingDriver.id,
      data: {
        name: data.name,
        phone: data.phone,
        licenseNo: data.licenseNo || '',
        truckId: data.truckId || '',
        status: data.status,
      },
    })
    setEditingDriver(null)
  }

  const handleAddTruck = (data: any) => {
    addTruck({
      plateNumber: data.plateNumber,
      model: data.model || '',
      maintenanceDate: data.maintenanceDate || '',
      fuelEfficiency: data.fuelEfficiency ? Number(data.fuelEfficiency) : undefined,
      status: data.status,
    })
    setShowTruckForm(false)
  }

  const handleEditTruck = (data: any) => {
    if (!editingTruck) return
    updateTruck({
      id: editingTruck.id,
      data: {
        plateNumber: data.plateNumber,
        model: data.model || '',
        maintenanceDate: data.maintenanceDate || '',
        fuelEfficiency: data.fuelEfficiency ? Number(data.fuelEfficiency) : undefined,
        status: data.status,
      },
    })
    setEditingTruck(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground">Manage drivers and trucks.</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <StatCard title="Total Drivers" value={String(drivers?.length || 0)} />
        <StatCard title="Available" value={String(availableDrivers)} variant="success" />
        <StatCard title="On Trip" value={String((drivers || []).filter(d => d.status === 'on_trip').length)} variant="warning" />
        <StatCard title="Total Trucks" value={String(trucks?.length || 0)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Drivers</CardTitle>
            <Button size="sm" onClick={() => setShowDriverForm(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Driver
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {driversLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (drivers || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">No drivers added yet</p>
              <p className="text-sm">Click "Add Driver" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(drivers || []).map((d) => (
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
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === d.id ? null : d.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === d.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setEditingDriver(d); setMenuOpen(null) }}>
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteDriver(d); setMenuOpen(null) }}>
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Trucks</CardTitle>
            <Button size="sm" onClick={() => setShowTruckForm(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Truck
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {trucksLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (trucks || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">No trucks added yet</p>
              <p className="text-sm">Click "Add Truck" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Fuel Eff.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(trucks || []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.plateNumber}</TableCell>
                    <TableCell>{t.model || '-'}</TableCell>
                    <TableCell className="text-sm">{t.maintenanceDate || '-'}</TableCell>
                    <TableCell className="text-sm">{t.fuelEfficiency ? `${t.fuelEfficiency} mpg` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'active' ? 'success' : t.status === 'maintenance' ? 'danger' : 'default'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(menuOpen === t.id ? null : t.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {menuOpen === t.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-md border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => { setEditingTruck(t); setMenuOpen(null) }}>
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => { setDeleteTruck(t); setMenuOpen(null) }}>
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DriverForm open={showDriverForm} onClose={() => setShowDriverForm(false)} onSubmit={handleAddDriver} />
      {editingDriver && (
        <DriverForm
          open={!!editingDriver}
          onClose={() => setEditingDriver(null)}
          onSubmit={handleEditDriver}
          initial={{
            name: editingDriver.name,
            phone: editingDriver.phone,
            licenseNo: editingDriver.licenseNo || '',
            truckId: editingDriver.truckId || '',
            status: editingDriver.status,
          }}
        />
      )}
      <TruckForm open={showTruckForm} onClose={() => setShowTruckForm(false)} onSubmit={handleAddTruck} />
      {editingTruck && (
        <TruckForm
          open={!!editingTruck}
          onClose={() => setEditingTruck(null)}
          onSubmit={handleEditTruck}
          initial={{
            plateNumber: editingTruck.plateNumber,
            model: editingTruck.model || '',
            maintenanceDate: editingTruck.maintenanceDate || '',
            fuelEfficiency: editingTruck.fuelEfficiency ? String(editingTruck.fuelEfficiency) : '',
            status: editingTruck.status,
          }}
        />
      )}
      <ConfirmDialog open={!!deleteDriver} onClose={() => setDeleteDriver(null)} onConfirm={() => { if (deleteDriver) { removeDriver(deleteDriver.id); setDeleteDriver(null) } }} title="Remove Driver" message={`Remove ${deleteDriver?.name} from the fleet?`} confirmLabel="Remove" />
      <ConfirmDialog open={!!deleteTruck} onClose={() => setDeleteTruck(null)} onConfirm={() => { if (deleteTruck) { removeTruck(deleteTruck.id); setDeleteTruck(null) } }} title="Remove Truck" message={`Remove truck ${deleteTruck?.plateNumber} from the fleet?`} confirmLabel="Remove" />
    </div>
  )
}