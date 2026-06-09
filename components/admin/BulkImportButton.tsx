'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Download, Loader2, CheckCircle, AlertCircle, SkipForward } from 'lucide-react'

export function BulkImportButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendEmails, setSendEmails] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(f: File) {
    if (f.name.endsWith('.csv')) setFile(f)
    else alert('Please upload a CSV file')
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('sendEmails', String(sendEmails))
    const res = await fetch('/dvl/api/admin/users/bulk', { method: 'POST', body: fd })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    router.refresh()
  }

  function downloadTemplate() {
    const csv = `name,email,role,password
Priya Sharma,priya@ifhe.edu.in,STUDENT,
Rahul Kumar,rahul@ifhe.edu.in,STUDENT,
Dr. Anita Verma,anita@ifhe.edu.in,FACULTY,
Rajesh Mehta,rajesh@company.com,MENTOR,`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dvl-users-template.csv'
    a.click()
  }

  function reset() {
    setFile(null)
    setResult(null)
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">
        <Upload className="w-4 h-4" /> Bulk import
      </button>

      {open && (
        <>
          <div onClick={() => { if (!loading) { setOpen(false); reset() } }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 51,
            overflowY: 'auto', padding: '32px 16px',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          }}>
            <div style={{
              width: '100%', maxWidth: 560,
              background: 'white', borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, background: 'white', borderRadius: '16px 16px 0 0', zIndex: 1,
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Bulk import users</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Upload a CSV to create multiple users at once
                  </p>
                </div>
                {!loading && (
                  <button onClick={() => { setOpen(false); reset() }} className="btn-ghost p-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div style={{ padding: 24 }}>
                {!result ? (
                  <>
                    {/* Template download */}
                    <div style={{
                      background: 'var(--dvl-purple-dim)', borderRadius: 10,
                      padding: '12px 16px', marginBottom: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--dvl-purple)' }}>
                          Download CSV template
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                          Columns: name, email, role, password (optional)
                        </p>
                      </div>
                      <button onClick={downloadTemplate} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Template
                      </button>
                    </div>

                    {/* CSV format guide */}
                    <div style={{ background: 'var(--surface-raised)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'sans-serif', fontSize: 11 }}>CSV FORMAT</p>
                      name,email,role,password<br/>
                      Priya Sharma,priya@ifhe.edu.in,STUDENT,<br/>
                      Dr. Anita,anita@ifhe.edu.in,FACULTY,MyPass123<br/>
                      <p style={{ margin: '8px 0 0', fontFamily: 'sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
                        Role must be: STUDENT, FACULTY, MENTOR, or ADMIN. Password is optional — a random one is generated if blank.
                      </p>
                    </div>

                    {/* File drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                      onClick={() => fileRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? 'var(--dvl-purple)' : file ? '#10b981' : 'var(--border-strong)'}`,
                        borderRadius: 12, padding: '32px 20px',
                        textAlign: 'center', cursor: 'pointer',
                        background: dragOver ? 'var(--dvl-purple-dim)' : file ? '#f0fdf4' : 'var(--surface-raised)',
                        transition: 'all 0.15s', marginBottom: 20,
                      }}
                    >
                      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                      {file ? (
                        <>
                          <CheckCircle style={{ width: 32, height: 32, color: '#10b981', margin: '0 auto 8px' }} />
                          <p style={{ margin: 0, fontWeight: 600, color: '#065f46' }}>{file.name}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6ee7b7' }}>
                            {(file.size / 1024).toFixed(1)} KB · Click to change
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload style={{ width: 32, height: 32, color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                          <p style={{ margin: 0, fontWeight: 600 }}>Drop your CSV here</p>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            or click to browse
                          </p>
                        </>
                      )}
                    </div>

                    {/* Send emails toggle */}
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10,
                      border: '1px solid var(--border)', cursor: 'pointer',
                      marginBottom: 24,
                      background: sendEmails ? 'var(--dvl-purple-dim)' : 'transparent',
                    }}>
                      <input type="checkbox" checked={sendEmails}
                        onChange={e => setSendEmails(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--dvl-purple)' }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                          Send welcome emails with login details
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                          Each user receives their email, password and login URL
                        </p>
                      </div>
                    </label>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => { setOpen(false); reset() }} className="btn-secondary" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button onClick={handleImport} disabled={!file || loading} className="btn-primary" style={{ flex: 2 }}>
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                          : <><Upload className="w-4 h-4" /> Import users</>}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Results */
                  <>
                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                      {[
                        { label: 'Created', value: result.summary.created, color: '#10b981', bg: '#f0fdf4', icon: CheckCircle },
                        { label: 'Skipped', value: result.summary.skipped, color: '#d97706', bg: '#fffbeb', icon: SkipForward },
                        { label: 'Errors', value: result.summary.errors, color: '#ef4444', bg: '#fef2f2', icon: AlertCircle },
                      ].map(({ label, value, color, bg, icon: Icon }) => (
                        <div key={label} style={{ background: bg, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                          <Icon style={{ width: 24, height: 24, color, margin: '0 auto 6px' }} />
                          <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color }}>{value}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Created users */}
                    {result.created.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#065f46', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ✅ Created ({result.created.length})
                        </p>
                        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #d1fae5', borderRadius: 8 }}>
                          {result.created.map((u: any, i: number) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', borderBottom: i < result.created.length - 1 ? '1px solid #d1fae5' : 'none',
                              fontSize: 13,
                            }}>
                              <div>
                                <span style={{ fontWeight: 500 }}>{u.name}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{u.email}</span>
                              </div>
                              <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 4 }}>
                                {u.role.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skipped */}
                    {result.skipped.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ⚠️ Skipped ({result.skipped.length})
                        </p>
                        <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #fde68a', borderRadius: 8 }}>
                          {result.skipped.map((u: any, i: number) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', borderBottom: i < result.skipped.length - 1 ? '1px solid #fde68a' : 'none',
                              fontSize: 13,
                            }}>
                              <span>{u.email}</span>
                              <span style={{ color: '#92400e', fontSize: 12 }}>{u.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={() => { setOpen(false); reset() }} className="btn-primary w-full">
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
