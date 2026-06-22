import type { User } from '@/types'

export const MOCK_USER: User = {
  id: 'mock-ceo-1',
  email: 'ceo@logicommand.com',
  name: 'Sarah CEO',
  role: 'CEO',
}

export const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'ceo@logicommand.com': {
    password: 'password123',
    user: { id: 'mock-ceo-1', email: 'ceo@logicommand.com', name: 'Sarah CEO', role: 'CEO' },
  },
  'ops@logicommand.com': {
    password: 'password123',
    user: { id: 'mock-ops-1', email: 'ops@logicommand.com', name: 'Mark Ops', role: 'OPS_MANAGER' },
  },
  'finance@logicommand.com': {
    password: 'password123',
    user: { id: 'mock-fin-1', email: 'finance@logicommand.com', name: 'Lisa Finance', role: 'FINANCE' },
  },
  'sales@logicommand.com': {
    password: 'password123',
    user: { id: 'mock-sal-1', email: 'sales@logicommand.com', name: 'James Sales', role: 'SALES' },
  },
  'support@logicommand.com': {
    password: 'password123',
    user: { id: 'mock-sup-1', email: 'support@logicommand.com', name: 'Emily Support', role: 'SUPPORT' },
  },
}
