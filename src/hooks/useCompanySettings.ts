import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useToastStore } from '@/store/toastStore'

export interface CompanySettings {
  name: string
  tagline: string
  address: string
  taxId: string
  phone: string
  email: string
}

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'LogiCommand',
  tagline: 'Logistics Enterprise Management',
  address: '123 Logistics Ave, New York, NY 10001',
  taxId: 'XX-XXXXXXX',
  phone: '+1-555-0000',
  email: 'info@logicommand.com',
}

const COMPANY_DOC = 'company'
const COMPANY_ID = 'settings'

export function useCompanySettings() {
  const addToast = useToastStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<CompanySettings>({
    queryKey: [COMPANY_DOC, COMPANY_ID],
    queryFn: async () => {
      const snap = await getDoc(doc(db, COMPANY_DOC, COMPANY_ID))
      if (snap.exists()) {
        return snap.data() as CompanySettings
      }
      return DEFAULT_SETTINGS
    },
    staleTime: 60000,
  })

  const saveSettings = async (data: CompanySettings) => {
    try {
      await setDoc(doc(db, COMPANY_DOC, COMPANY_ID), data)
      queryClient.invalidateQueries({ queryKey: [COMPANY_DOC, COMPANY_ID] })
      addToast('Company settings saved.', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to save settings.', 'error')
    }
  }

  return { settings: settings || DEFAULT_SETTINGS, isLoading, saveSettings, DEFAULT_SETTINGS }
}