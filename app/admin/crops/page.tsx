'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2, ImagePlus, Leaf, Search } from 'lucide-react'
import { SortableTh } from '@/components/admin/sortable-th'
import { useSort } from '@/lib/use-sort'

interface CropInfo {
  id: number
  name: string
  name_en?: string
  emoji?: string
  season_sw?: string
  season_en?: string
  water_sw?: string
  water_en?: string
  temperature?: string
  yield_sw?: string
  yield_en?: string
  diseases?: string[]
  tips_sw?: string
  tips_en?: string
  accent_color?: string
  image_url?: string | null
}

const BLANK: Omit<CropInfo, 'id'> = {
  name: '', name_en: '', emoji: '🌿', season_sw: '', season_en: '',
  water_sw: '', water_en: '', temperature: '', yield_sw: '', yield_en: '',
  diseases: [], tips_sw: '', tips_en: '', accent_color: '#2a5c3f', image_url: null,
}

type SortKey = 'name' | 'name_en' | 'season_sw' | 'temperature'

export default function AdminCropsPage() {
  const [crops, setCrops] = useState<CropInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState<CropInfo | null>(null)
  const [form, setForm] = useState<Omit<CropInfo, 'id'>>(BLANK)
  const [diseasesInput, setDiseasesInput] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function handleImageUpload(file: File) {
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return }
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) { toast.error('Use a JPEG, PNG, or WebP image'); return }

    setUploadingImage(true)
    const path = `crops/${Date.now()}.jpg`
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

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('crop_info').select('*').order('id')
    setCrops(data ?? [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return crops
    return crops.filter(c =>
      c.name.toLowerCase().includes(q) || (c.name_en ?? '').toLowerCase().includes(q)
    )
  }, [crops, search])

  const { sortKey, sortDir, toggleSort, sorted } = useSort<CropInfo, SortKey>(filtered, 'name', (c, key) => c[key] ?? '')

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm(BLANK)
    setDiseasesInput('')
    setModal(true)
  }

  function openEdit(c: CropInfo) {
    setEditing(c)
    setForm({ ...c })
    setDiseasesInput((c.diseases ?? []).join(', '))
    setModal(true)
  }

  function openDelete(id: number) { setDeleteId(id); setConfirm(true) }

  function f(key: keyof typeof BLANK, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    if (!form.name) { toast.error('Crop name is required'); return }
    setSaving(true)
    const payload = { ...form, diseases: diseasesInput ? diseasesInput.split(',').map(s => s.trim()).filter(Boolean) : [] }
    if (editing) {
      const { error } = await supabase.from('crop_info').update(payload).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Crop updated')
    } else {
      const { error } = await supabase.from('crop_info').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Crop added')
    }
    setSaving(false); setModal(false); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('crop_info').delete().eq('id', deleteId)
    if (error) toast.error(error.message)
    else { toast.success('Crop deleted'); load() }
    setDeleting(false); setConfirm(false); setDeleteId(null)
  }

  const FieldRow = ({ label, swKey, enKey }: { label: string; swKey: keyof typeof BLANK; enKey: keyof typeof BLANK }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input value={(form[swKey] as string) ?? ''} onChange={e => f(swKey, e.target.value)} placeholder="Kiswahili" />
        <Input value={(form[enKey] as string) ?? ''} onChange={e => f(enKey, e.target.value)} placeholder="English" />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Crop Information</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{crops.length} crops</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <Input placeholder="Search crop name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={openAdd} size="sm" className="gap-1.5 shrink-0"><Plus className="h-4 w-4" /> Add Crop</Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="px-4 py-3" />
                <SortableTh label="Name (SW)" sortKey="name" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <SortableTh label="Name (EN)" sortKey="name_en" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <SortableTh label="Season" sortKey="season_sw" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <SortableTh label="Temperature" sortKey="temperature" activeKey={sortKey} direction={sortDir} onClick={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {search ? 'No crops match your search.' : 'No crops yet. Run the seed SQL or click "Add Crop".'}
                  </td>
                </tr>
              ) : sorted.map(crop => (
                <tr key={crop.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    {crop.image_url ? (
                      <img src={crop.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <span className="text-lg">{crop.emoji ?? '🌿'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{crop.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{crop.name_en}</td>
                  <td className="px-4 py-3 text-xs max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }}>{crop.season_sw}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{crop.temperature}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(crop)} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openDelete(crop.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Crop' : 'Add Crop Info'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                  : <Leaf className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <Input value={form.emoji ?? ''} onChange={e => f('emoji', e.target.value)} placeholder="🌿" className="text-lg" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <input type="color" value={form.accent_color ?? '#2a5c3f'} onChange={e => f('accent_color', e.target.value)}
                  className="h-10 w-14 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} />
                <Input value={form.accent_color ?? ''} onChange={e => f('accent_color', e.target.value)} placeholder="#2a5c3f" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Name</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Kiswahili (required)" />
              <Input value={form.name_en ?? ''} onChange={e => f('name_en', e.target.value)} placeholder="English" />
            </div>
          </div>

          <FieldRow label="Season" swKey="season_sw" enKey="season_en" />
          <FieldRow label="Water Needs" swKey="water_sw" enKey="water_en" />

          <div className="space-y-1.5">
            <Label>Temperature Range</Label>
            <Input value={form.temperature ?? ''} onChange={e => f('temperature', e.target.value)} placeholder="e.g. 18–30°C" />
          </div>

          <FieldRow label="Yield Estimate" swKey="yield_sw" enKey="yield_en" />

          <div className="space-y-1.5">
            <Label>Diseases (comma-separated)</Label>
            <Input value={diseasesInput} onChange={e => setDiseasesInput(e.target.value)} placeholder="e.g. Maize streak, Rust, Armyworm" />
          </div>

          <FieldRow label="Farming Tips" swKey="tips_sw" enKey="tips_en" />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Crop" description="This will permanently remove this crop entry." />
    </div>
  )
}
