import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useToastStore } from '@/store/toastStore'

interface MutationCallbacks {
  onSuccess?: () => void
}

export function useFirestoreMutation<T extends DocumentData>(collectionName: string, callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [collectionName] })
    callbacks?.onSuccess?.()
  }

  const addMutation = useMutation({
    mutationFn: async (data: T) => {
      const ref = collection(db, collectionName)
      await addDoc(ref, { ...data, createdAt: serverTimestamp() })
    },
    onSuccess: () => {
      invalidate()
      addToast('Created successfully', 'success')
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      const ref = doc(db, collectionName, id)
      await updateDoc(ref, data)
    },
    onSuccess: () => {
      invalidate()
      addToast('Updated successfully', 'success')
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const ref = doc(db, collectionName, id)
      await deleteDoc(ref)
    },
    onSuccess: () => {
      invalidate()
      addToast('Deleted successfully', 'info')
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  return {
    add: addMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
