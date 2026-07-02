'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'
import { adminFetch, toastError, toastSuccess } from '@/lib/admin-api'

interface FileUploadFieldProps {
  id: string
  label: string
  kind: 'image' | 'document'
  /** Section de contenu côté serveur (ex. 'archives') — voir UPLOAD_SCOPES. */
  scope: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
}

const ACCEPT: Record<FileUploadFieldProps['kind'], string> = {
  image: 'image/jpeg,image/png,image/webp',
  document: 'application/pdf',
}

/**
 * Champ URL + bouton de téléversement direct vers R2.
 * L'URL reste éditable à la main : coller un lien externe fonctionne toujours,
 * notamment tant que le stockage n'est pas configuré (le serveur répond 503
 * avec un message explicite).
 */
export function FileUploadField({
  id,
  label,
  kind,
  scope,
  value,
  onChange,
  placeholder,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const res = await adminFetch('/api/admin/upload', {
        method: 'POST',
        body: { kind, scope, filename: file.name, contentType: file.type, size: file.size },
        fallbackError: 'Échec de la préparation du téléversement.',
      })
      const { uploadUrl, publicUrl } = await res.json()

      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!put.ok) throw new Error(`Le stockage a refusé le fichier (HTTP ${put.status}).`)

      onChange(publicUrl)
      toastSuccess('Fichier téléversé.')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Échec du téléversement.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'https://... ou téléversez'}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          title="Téléverser un fichier"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
