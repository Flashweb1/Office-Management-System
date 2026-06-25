export type Role = 'CEO' | 'OPS_MANAGER' | 'FINANCE' | 'SALES' | 'SUPPORT' | 'PENDING'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string
}

export interface Staff {
  id: string
  userId: string
  name: string
  position: string
  department: string
  phone: string
  email: string
  salary: number
  hireDate: string
  status: 'active' | 'inactive'
}

export interface Customer {
  id: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  creditLimit: number
  balance: number
  paymentTerms: string
  onHold: boolean
  notes?: string
  createdAt: string
}

export interface ContactLog {
  id: string
  customerId: string
  userId: string
  userName: string
  type: 'call' | 'email' | 'meeting' | 'complaint'
  note: string
  createdAt: string
}

export interface Shipment {
  id: string
  customerId: string
  customerName: string
  driverId?: string
  driverName?: string
  pickupDate: string
  deliveryDate: string
  revenue: number
  cost: number
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'
  lane?: string
  notes?: string
  createdAt: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  licenseNo?: string
  truckId?: string
  status: 'available' | 'on_trip' | 'off_duty'
}

export interface Truck {
  id: string
  plateNumber: string
  model?: string
  maintenanceDate?: string
  fuelEfficiency?: number
  status: 'active' | 'maintenance' | 'inactive'
}

export interface Invoice {
  id: string
  customerId: string
  customerName: string
  shipmentId?: string
  amount: number
  dueDate: string
  paid: boolean
  paidDate?: string
  paymentRef?: string
  createdAt: string
}

export interface Expense {
  id: string
  description: string
  category: 'fuel' | 'maintenance' | 'admin' | 'tolls' | 'driver_pay' | 'other'
  amount: number
  date: string
  shipmentId?: string
}

export interface Alert {
  id: string
  type: string
  message: string
  entityType?: string
  entityId?: string
  resolved: boolean
  createdAt: string
}

export interface DashboardMetrics {
  grossMargin: number
  revenueMtd: number
  onTimeDelivery: number
  arOverdue: number
  openComplaints: number
  fleetUtilization: number
}

export interface AIInsight {
  id: string
  type: 'anomaly' | 'prediction' | 'recommendation'
  message: string
  severity: 'low' | 'medium' | 'high'
  entityType?: string
  entityId?: string
  seen: boolean
  createdAt: string
}

export interface PayrollRun {
  id: string
  periodStart: string
  periodEnd: string
  processedAt: string
  status: 'draft' | 'processed'
  totalGross: number
  totalDeductions: number
  totalNet: number
  processedBy: string
}

export interface PayStub {
  id: string
  payrollRunId: string
  staffId: string
  staffName: string
  grossPay: number
  deductions: {
    tax: number
    insurance: number
    retirement: number
    other: number
  }
  netPay: number
  hoursWorked: number
}

export interface TimeOff {
  id: string
  staffId: string
  staffName: string
  type: 'vacation' | 'sick' | 'personal'
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  createdAt: string
}

export interface Timesheet {
  id: string
  staffId: string
  staffName: string
  weekStart: string
  hours: {
    mon: number
    tue: number
    wed: number
    thu: number
    fri: number
    sat: number
    sun: number
  }
  total: number
  status: 'draft' | 'submitted' | 'approved'
  approvedBy?: string
  createdAt: string
}

export interface Review {
  id: string
  staffId: string
  staffName: string
  reviewerId: string
  reviewerName: string
  date: string
  rating: number
  strengths: string
  improvements: string
  goals: string
  status: 'draft' | 'completed'
}
