'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle, ExternalLink, X } from 'lucide-react'

interface FileUploadProps {
  teamId: string
  fileType: string
  milestoneId?: string
  onSuccess?: (fileUrl: string, fileName: string) => void
  label?: string
  accept?: string
}

export function FileUpload({ teamId, fileType, milestoneId, onSuccess, label, accept }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<{ name: string; url: string } | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('teamId', teamId)
    fd.append('type', fileType)
    if (milestoneId) fd.append('milestoneId', milestoneId)

    const res = await fetch('/dvl/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)

    if (res.ok) {
      setUploaded({ name: file.name, url: data.driveUrl ?? '#' })
      onSuccess?.(data.driveUrl, file.name)
    } else {
      setError(data.error ?? 'Upload failed')
    }
  }

  if (uploaded) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: '#f0fdf4',
        borderRadius: 8, border: '1px solid #d1fae5',
      }}>
        <CheckCircle style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
        <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {uploaded.name}
        </span>
        <a href={uploaded.url} target="_blank" rel="noopener noreferrer"
           style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, whiteSpace: 'nowrap' }}>
          View <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
        <button onClick={() => setUploaded(null)}
          style={{ color: '#6ee7b7', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleUpload(file)
        }}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--dvl-purple)' : 'var(--border-strong)'}`,
          borderRadius: 8, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragOver ? 'var(--dvl-purple-dim)' : 'var(--surface-raised)',
          transition: 'all 0.15s',
        }}
      >
        <input ref={fileRef} type="file" accept={accept ?? '*/*'} style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
        {uploading ? (
          <>
            <Loader2 style={{ width: 16, height: 16, color: 'var(--dvl-purple)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Uploading to Google Drive…</span>
          </>
        ) : (
          <>
            <Upload style={{ width: 16, height: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {label ?? `Upload ${fileType}`} — drop or click
            </span>
          </>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
