import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'danger'
  link?: string
  relatedTo?: { collection: string; id: string }
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || null,
      relatedTo: params.relatedTo || null,
      read: false,
      createdAt: serverTimestamp(),
    })
  } catch {
    // silently fail — notifications are non-critical
  }
}