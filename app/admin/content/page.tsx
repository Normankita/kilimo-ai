'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'

interface Content {
  id: number
  title: string
  description: string
  video_url: string
  category: string
  crop_name: string
  language: string
}

const BLANK: Omit<Content, 'id'> = {
  title: '', description: '', video_url: '', category: 'kupanda', crop_name: '', language: 'Kiswahili',
}

const CATEGORIES = ['kupanda', 'umwagiliaji', 'magonjwa', 'mboji', 'masoko']
const LANGUAGES = ['Kiswahili', 'English']
const CAT_COLORS: Record<string, string> = {
  kupanda: 'success', umwagiliaji: 'secondary', magonjwa: 'destructive',
}

export default function AdminContentPage() {
  const [items, setItems] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState<Content | null>(null)
  const [form, setForm] = useState(BLANK)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('educational_content').select('*').order('id', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm(BLANK); setModal(true) }
  function openEdit(item: Content) { setEditing(item); setForm({ title: item.title, description: item.description, video_url: item.video_url, category: item.category, crop_name: item.crop_name, language: item.language }); setModal(true) }
  function openDelete(id: number) { setDeleteId(id); setConfirm(true) }

  async function handleSave() {
    if (!form.title || !form.video_url) { toast.error('Title and YouTube URL are required'); return }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('educational_content').update(form).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Video updated')
    } else {
      const { error } = await supabase.from('educational_content').insert(form)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Video added')
    }
    setSaving(false); setModal(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('educational_content').delete().eq('id', deleteId)
    if (error) toast.error(error.message)
    else { toast.success('Video deleted'); load() }
    setDeleting(false); setConfirm(false); setDeleteId(null)
  }

  function f(key: keyof typeof BLANK, val: string) { setForm(prev => ({ ...prev, [key]: val })) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Educational Content</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{items.length} videos</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Title', 'Category', 'Crop', 'Language', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No videos yet.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{item.title}</span>
                      <a href={item.video_url} target="_blank" rel="noreferrer" className="shrink-0">
                        <ExternalLink className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={(CAT_COLORS[item.category] as 'success' | 'secondary' | 'destructive') || 'outline'}>
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{item.crop_name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{item.language}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Video' : 'Add Video'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Video title" />
          </div>
          <div className="space-y-1.5">
            <Label>YouTube URL *</Label>
            <Input value={form.video_url} onChange={e => f('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)}
              placeholder="Brief description of the video"
              rows={3} className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={form.category} onChange={e => f('category', e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <select value={form.language} onChange={e => f('language', e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Crop Name</Label>
            <Input value={form.crop_name} onChange={e => f('crop_name', e.target.value)} placeholder="e.g. Mahindi, Nyanya" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Video" description="This will permanently remove this video entry." />
    </div>
  )
}
