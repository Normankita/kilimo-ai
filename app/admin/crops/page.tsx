'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

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
}

const BLANK: Omit<CropInfo, 'id'> = {
  name: '', name_en: '', emoji: '🌿', season_sw: '', season_en: '',
  water_sw: '', water_en: '', temperature: '', yield_sw: '', yield_en: '',
  diseases: [], tips_sw: '', tips_en: '', accent_color: '#2a5c3f',
}

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

  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('crop_info').select('*').order('id')
    setCrops(data ?? [])
    setLoading(false)
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Crop Information</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{crops.length} crops</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Crop</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Name (SW)', 'Name (EN)', 'Season', 'Temperature', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : crops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No crops yet. Run the seed SQL or click "Add Crop".
                  </td>
                </tr>
              ) : crops.map(crop => (
                <tr key={crop.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3 text-lg">{crop.emoji ?? '🌿'}</td>
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
