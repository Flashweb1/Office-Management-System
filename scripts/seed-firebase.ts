/**
 * Firebase seed script.
 * Run with: npx tsx scripts/seed-firebase.ts
 * 
 * Prerequisites:
 * 1. Create a Firebase project
 * 2. Enable Email/Password auth
 * 3. Create a Firestore database
 * 4. Generate a service account key (Project Settings > Service Accounts)
 * 5. Set GOOGLE_APPLICATION_CREDENTIALS env var or download key as serviceAccountKey.json
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Try loading service account key
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json')
if (!fs.existsSync(keyPath)) {
  console.error('Missing serviceAccountKey.json. Download it from Firebase Console > Project Settings > Service Accounts')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

async function seed() {
  console.log('Seeding Firebase...\n')

  // Create users
  const users = [
    { email: 'ceo@logicommand.com', password: 'password123', name: 'Sarah CEO', role: 'CEO' },
    { email: 'ops@logicommand.com', password: 'password123', name: 'Mark Ops', role: 'OPS_MANAGER' },
    { email: 'finance@logicommand.com', password: 'password123', name: 'Lisa Finance', role: 'FINANCE' },
    { email: 'sales@logicommand.com', password: 'password123', name: 'James Sales', role: 'SALES' },
    { email: 'support@logicommand.com', password: 'password123', name: 'Emily Support', role: 'SUPPORT' },
  ]

  for (const u of users) {
    try {
      const userRecord = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.name,
      })
      await db.collection('users').doc(userRecord.uid).set({
        name: u.name,
        email: u.email,
        role: u.role,
      })
      console.log(`  Created user: ${u.email} (${u.role})`)
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        console.log(`  Skipped ${u.email} (already exists)`)
      } else {
        console.error(`  Error creating ${u.email}:`, err.message)
      }
    }
  }

  // Create sample customers
  const customers = [
    { companyName: 'ABC Logistics', contactPerson: 'John Smith', phone: '+1-555-1001', email: 'john@abclogistics.com', creditLimit: 50000, balance: 41000, paymentTerms: 'net30', onHold: false },
    { companyName: 'Global Freight Solutions', contactPerson: 'Maria Garcia', phone: '+1-555-1002', email: 'maria@globalfreight.com', creditLimit: 75000, balance: 28000, paymentTerms: 'net30', onHold: false },
    { companyName: 'ShipFast Inc', contactPerson: 'David Lee', phone: '+1-555-1003', email: 'david@shipfast.io', creditLimit: 35000, balance: 32000, paymentTerms: 'net15', onHold: false },
    { companyName: 'CargoPro Logistics', contactPerson: 'Sarah Chen', phone: '+1-555-1004', email: 'sarah@cargopro.com', creditLimit: 60000, balance: 15000, paymentTerms: 'net45', onHold: false },
    { companyName: 'TransPort Co', contactPerson: 'Mike Johnson', phone: '+1-555-1005', email: 'mike@transport.co', creditLimit: 40000, balance: 38000, paymentTerms: 'net30', onHold: true },
    { companyName: 'QuickMove Ltd', contactPerson: 'Emma Wilson', phone: '+1-555-1006', email: 'emma@quickmove.com', creditLimit: 25000, balance: 22000, paymentTerms: 'net30', onHold: false },
    { companyName: 'StarHaulers', contactPerson: 'Tom Brown', phone: '+1-555-1007', email: 'tom@starhaulers.com', creditLimit: 30000, balance: 5000, paymentTerms: 'net15', onHold: false },
  ]

  for (const c of customers) {
    const ref = db.collection('customers').doc()
    await ref.set({ ...c, createdAt: new Date().toISOString() })
    console.log(`  Created customer: ${c.companyName}`)
  }

  // Create sample staff
  const staffList = [
    { name: 'Sarah Johnson', email: 'sarah.j@logicommand.com', position: 'Operations Manager', department: 'Operations', phone: '+1-555-0101', salary: 85000, hireDate: '2022-03-15', status: 'active' },
    { name: 'Mark Chen', email: 'mark.c@logicommand.com', position: 'Fleet Supervisor', department: 'Operations', phone: '+1-555-0102', salary: 72000, hireDate: '2021-08-01', status: 'active' },
    { name: 'Lisa Rodriguez', email: 'lisa.r@logicommand.com', position: 'Finance Controller', department: 'Finance', phone: '+1-555-0103', salary: 92000, hireDate: '2020-11-20', status: 'active' },
    { name: 'James Wilson', email: 'james.w@logicommand.com', position: 'Sales Lead', department: 'Sales', phone: '+1-555-0104', salary: 78000, hireDate: '2023-01-10', status: 'active' },
    { name: 'Emily Davis', email: 'emily.d@logicommand.com', position: 'Customer Support', department: 'Support', phone: '+1-555-0105', salary: 48000, hireDate: '2023-06-05', status: 'active' },
    { name: 'Robert Kim', email: 'robert.k@logicommand.com', position: 'Driver', department: 'Fleet', phone: '+1-555-0106', salary: 55000, hireDate: '2022-09-12', status: 'active' },
    { name: 'Anna Martinez', email: 'anna.m@logicommand.com', position: 'Driver', department: 'Fleet', phone: '+1-555-0107', salary: 55000, hireDate: '2022-10-20', status: 'active' },
  ]

  for (const s of staffList) {
    const ref = db.collection('staff').doc()
    await ref.set(s)
    console.log(`  Created staff: ${s.name}`)
  }

  // Create sample shipments
  const shipmentData = [
    { customerName: 'ABC Logistics', lane: 'NYC → CHI', pickupDate: '2026-06-10', deliveryDate: '2026-06-12', revenue: 3200, cost: 2600, status: 'delivered' },
    { customerName: 'Global Freight Solutions', lane: 'LA → SF', pickupDate: '2026-06-11', deliveryDate: '2026-06-11', revenue: 1800, cost: 1200, status: 'delivered' },
    { customerName: 'ShipFast Inc', lane: 'CHI → NYC', pickupDate: '2026-06-12', deliveryDate: '2026-06-13', revenue: 2500, cost: 2100, status: 'delivered' },
    { customerName: 'CargoPro Logistics', lane: 'MIA → ATL', pickupDate: '2026-06-12', deliveryDate: '2026-06-13', revenue: 1500, cost: 1100, status: 'in_transit' },
    { customerName: 'QuickMove Ltd', lane: 'CHI → DET', pickupDate: '2026-06-13', deliveryDate: '2026-06-15', revenue: 1200, cost: 1320, status: 'delayed' },
    { customerName: 'ABC Logistics', lane: 'NYC → BOS', pickupDate: '2026-06-14', deliveryDate: '2026-06-16', revenue: 2800, cost: 2200, status: 'in_transit' },
    { customerName: 'TransPort Co', lane: 'NYC → BOS', pickupDate: '2026-06-13', deliveryDate: '2026-06-14', revenue: 2200, cost: 1800, status: 'in_transit' },
    { customerName: 'StarHaulers', lane: 'ATL → MIA', pickupDate: '2026-06-14', deliveryDate: '2026-06-15', revenue: 850, cost: 960, status: 'pending' },
  ]

  for (const s of shipmentData) {
    const ref = db.collection('shipments').doc()
    await ref.set({ ...s, createdAt: new Date().toISOString() })
    console.log(`  Created shipment: ${s.lane}`)
  }

  // Create sample invoices
  const invoiceData = [
    { customerName: 'ABC Logistics', amount: 3200, dueDate: '2026-07-12', paid: false },
    { customerName: 'Global Freight Solutions', amount: 4800, dueDate: '2026-07-15', paid: false },
    { customerName: 'ShipFast Inc', amount: 2500, dueDate: '2026-06-28', paid: false },
    { customerName: 'CargoPro Logistics', amount: 1500, dueDate: '2026-07-20', paid: false },
    { customerName: 'TransPort Co', amount: 2200, dueDate: '2026-06-25', paid: false },
    { customerName: 'ABC Logistics', amount: 1200, dueDate: '2026-07-15', paid: false },
    { customerName: 'Global Freight Solutions', amount: 5000, dueDate: '2026-06-01', paid: true, paidDate: '2026-05-28', paymentRef: 'PAY-891' },
    { customerName: 'ABC Logistics', amount: 5000, dueDate: '2026-06-01', paid: true, paidDate: '2026-05-25', paymentRef: 'PAY-876' },
  ]

  for (const inv of invoiceData) {
    const ref = db.collection('invoices').doc()
    await ref.set({ ...inv, createdAt: new Date().toISOString() })
    console.log(`  Created invoice: $${inv.amount}`)
  }

  // Create sample drivers
  const drivers = [
    { name: 'Robert Kim', phone: '+1-555-2001', licenseNo: 'CDL-A 88452', truckPlate: 'TRK-001', status: 'on_trip', trips: 12 },
    { name: 'Anna Martinez', phone: '+1-555-2002', licenseNo: 'CDL-A 77123', truckPlate: 'TRK-002', status: 'on_trip', trips: 10 },
    { name: 'Carlos Rivera', phone: '+1-555-2003', licenseNo: 'CDL-A 66541', truckPlate: 'TRK-003', status: 'available', trips: 8 },
    { name: 'Diana Park', phone: '+1-555-2004', licenseNo: 'CDL-A 55236', truckPlate: 'TRK-004', status: 'off_duty', trips: 9 },
    { name: 'Frank Thompson', phone: '+1-555-2005', licenseNo: 'CDL-A 99874', truckPlate: 'TRK-005', status: 'available', trips: 6 },
  ]

  for (const d of drivers) {
    const ref = db.collection('drivers').doc()
    await ref.set(d)
    console.log(`  Created driver: ${d.name}`)
  }

  console.log('\nSeed complete!')
  console.log('Login credentials:')
  console.log('  CEO:    ceo@logicommand.com / password123')
  console.log('  Ops:    ops@logicommand.com / password123')
  console.log('  Finance: finance@logicommand.com / password123')
  console.log('  Sales:  sales@logicommand.com / password123')
  console.log('  Support: support@logicommand.com / password123')
}

seed().catch(console.error)
