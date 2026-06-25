import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/services/firebase'
import { Button } from './button'
import { useToastStore } from '@/store/toastStore'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

interface UploadedFile {
  name: string
  url: string
  path: string
}

interface FileUploadProps {
  path: string
  accept?: string
  maxSizeMB?: number
  onUpload: (file: UploadedFile) => void
  onRemove?: (file: UploadedFile) => void
  existingFiles?: UploadedFile[]
}

export function FileUpload({ path, accept = '*', maxSizeMB = 10, onUpload, onRemove, existingFiles }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMB * 1024 * 1024) {
      addToast(`File must be under ${maxSizeMB}MB.`, 'error')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const storageRef = ref(storage, `${path}/${file.name}`)
      const task = uploadBytesResumable(storageRef, file)

      task.on('state_changed', (snap) => {
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
      })

      await task
      const url = await getDownloadURL(storageRef)
      onUpload({ name: file.name, url, path: `${path}/${file.name}` })
      addToast(`${file.name} uploaded.`, 'success')
    } catch (err: any) {
      addToast(err.message || 'Upload failed.', 'error')
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async (file: UploadedFile) => {
    try {
      await deleteObject(ref(storage, file.path))
      onRemove?.(file)
    } catch {
      addToast('Failed to delete file.', 'error')
    }
  }

  return (
    <div className="space-y-2">
      {(existingFiles || []).length > 0 && (
        <div className="space-y-1">
          {(existingFiles || []).map((f) => (
            <div key={f.path} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 shrink-0 text-primary" />
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{f.name}</a>
              </div>
              <button onClick={() => handleRemove(f)} className="shrink-0 text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> {progress}%</>
          ) : (
            <><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload File</>
          )}
        </Button>
      </div>
    </div>
  )
}

export type { UploadedFile }