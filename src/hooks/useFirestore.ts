import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  type QueryConstraint,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

type WhereFilter = [string, '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains' | 'in' | 'not-in', any]
type OrderByFilter = [string, 'asc' | 'desc']

interface UseCollectionOptions {
  whereFilters?: WhereFilter[]
  orderByFilter?: OrderByFilter
  limitCount?: number
}

export function useCollection<T = DocumentData>(
  collectionName: string,
  options?: UseCollectionOptions
) {
  const queryKey = [collectionName, options]

  return useQuery<T[], FirestoreError>({
    queryKey,
    queryFn: async () => {
      const constraints: QueryConstraint[] = []

      if (options?.whereFilters) {
        options.whereFilters.forEach((f) => {
          constraints.push(where(f[0], f[1], f[2]))
        })
      }

      if (options?.orderByFilter) {
        constraints.push(orderBy(options.orderByFilter[0], options.orderByFilter[1]))
      }

      if (options?.limitCount) {
        constraints.push(limit(options.limitCount))
      }

      const q = constraints.length > 0
        ? query(collection(db, collectionName), ...constraints)
        : collection(db, collectionName)

      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[]
    },
    staleTime: 30000,
  })
}

export function useDocument<T = DocumentData>(collectionName: string, documentId: string | undefined) {
  return useQuery<T | null, FirestoreError>({
    queryKey: [collectionName, documentId],
    queryFn: async () => {
      if (!documentId) return null
      const ref = doc(db, collectionName, documentId)
      const snapshot = await getDoc(ref)
      if (!snapshot.exists()) return null
      return { id: snapshot.id, ...snapshot.data() } as T
    },
    enabled: !!documentId,
    staleTime: 30000,
  })
}
