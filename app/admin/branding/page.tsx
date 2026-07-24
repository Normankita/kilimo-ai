'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2, ImagePlus, ImageIcon, ArrowUp, ArrowDown } from 'lucide-react'

interface BrandingImage {
  id: number
  image_url: string
  caption: string | null
  sort_order: number
}

const BLANK: Omit<BrandingImage, 'id'> = { image_url: '', caption: '', sort_order: 0 }

export default function AdminBrandingPage() {
  const [images, setImages] = useState<BrandingImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reorderingId, setReorderingId] = useState<number | null>(null)
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState<BrandingImage | null>(null)
  const [form, setForm] = useState<Omit<BrandingImage, 'id'>>(BLANK)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('branding_images').select('*').order('sort_order')
    setImages(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...BLANK, sort_order: images.length })
    setModal(true)
  }

  function openEdit(img: BrandingImage) {
    setEditing(img)
    setForm({ ...img })
    setModal(true)
  }

  function openDelete(id: number) { setDeleteId(id); setConfirm(true) }

  async function handleImageUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) { toast.error('Use a JPEG, PNG, or WebP image'); return }

    setUploadingImage(true)
    const path = `branding/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('site-media')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploadingImage(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('site-media').getPublicUrl(path)
    setForm(prev => ({ ...prev, image_url: publicUrl }))
    setUploadingImage(false)
  }

  async function handleSave() {
    if (!form.image_url) { toast.error('Upload a photo first'); return }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('branding_images').update(form).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Image updated')
    } else {
      const { error } = await supabase.from('branding_images').insert(form)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Image added')
    }
    setSaving(false); setModal(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('branding_images').delete().eq('id', deleteId)
    if (error) toast.error(error.message)
    else { toast.success('Image removed'); load() }
    setDeleting(false); setConfirm(false); setDeleteId(null)
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const other = images[index + direction]
    const current = images[index]
    if (!other) return
    setReorderingId(current.id)
    const [a, b] = [
      supabase.from('branding_images').update({ sort_order: other.sort_order }).eq('id', current.id),
      supabase.from('branding_images').update({ sort_order: current.sort_order }).eq('id', other.id),
    ]
    const [ra, rb] = await Promise.all([a, b])
    if (ra.error || rb.error) toast.error(ra.error?.message ?? rb.error?.message ?? 'Failed to reorder')
    setReorderingId(null)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Branding Images</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {images.length} photos shown on the public landing page
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Image</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Photo', 'Caption', 'Order', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : images.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No branding images yet. Click "Add Image" to show real photos on the landing page.
                  </td>
                </tr>
              ) : images.map((img, i) => (
                <tr key={img.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    <img src={img.image_url} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[240px] truncate" style={{ color: 'var(--text-muted)' }}>{img.caption ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMove(i, -1)} disabled={i === 0 || reorderingId === img.id}
                        className="p-1 rounded hover:bg-[var(--surface-2)] disabled:opacity-30" style={{ color: 'var(--text-muted)' }}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleMove(i, 1)} disabled={i === images.length - 1 || reorderingId === img.id}
                        className="p-1 rounded hover:bg-[var(--surface-2)] disabled:opacity-30" style={{ color: 'var(--text-muted)' }}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(img)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openDelete(img.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Image' : 'Add Branding Image'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-28 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                  : <ImageIcon className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                }
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file) }}
              />
              <Button type="button" variant="outline" size="sm" className="gap-1.5"
                onClick={() => fileRef.current?.click()} disabled={uploadingImage}>
                <ImagePlus className="h-3.5 w-3.5" />
                {uploadingImage ? 'Uploading...' : form.image_url ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Caption (optional)</Label>
            <Input value={form.caption ?? ''} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="e.g. A farmer in Dodoma using NorZah Kilimo Smart assist" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || uploadingImage}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Image" description="This will remove the photo from the landing page." />
    </div>
  )
}
