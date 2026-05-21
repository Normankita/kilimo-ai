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

interface Price {
  id: number
  crop_name: string
  price_per_kg: number
  market_location: string
  recorded_date: string
}

const BLANK: Omit<Price, 'id'> = {
  crop_name: '', price_per_kg: 0, market_location: '', recorded_date: new Date().toISOString().split('T')[0],
}

const LOCATIONS = ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mbeya', 'Mwanza', 'Morogoro']
const CROPS = ['Mahindi', 'Mchele', 'Nyanya', 'Maharage', 'Vitunguu', 'Karoti', 'Ndizi']

export default function AdminMarketPage() {
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState<Price | null>(null)
  const [form, setForm] = useState(BLANK)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('market_prices').select('*').order('recorded_date', { ascending: false })
    setPrices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm(BLANK); setModal(true) }
  function openEdit(p: Price) { setEditing(p); setForm({ crop_name: p.crop_name, price_per_kg: p.price_per_kg, market_location: p.market_location, recorded_date: p.recorded_date }); setModal(true) }
  function openDelete(id: number) { setDeleteId(id); setConfirm(true) }

  async function handleSave() {
    if (!form.crop_name || !form.market_location || !form.price_per_kg) {
      toast.error('Please fill all required fields')
      return
    }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('market_prices').update(form).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Price updated')
    } else {
      const { error } = await supabase.from('market_prices').insert(form)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Price added')
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('market_prices').delete().eq('id', deleteId)
    if (error) toast.error(error.message)
    else { toast.success('Price deleted'); load() }
    setDeleting(false)
    setConfirm(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Market Prices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{prices.length} entries</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Price
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Crop', 'Price (TZS/kg)', 'Location', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-2.5"><div className="h-6 rounded shimmer" /></td></tr>
                ))
              ) : prices.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No prices yet. Click "Add Price" to start.</td></tr>
              ) : prices.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{p.crop_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--primary)' }}>{p.price_per_kg.toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{p.market_location}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.recorded_date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openDelete(p.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20" style={{ color: 'var(--text-muted)' }}>
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

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Price' : 'Add Market Price'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Crop *</Label>
            <select value={form.crop_name} onChange={e => setForm(f => ({ ...f, crop_name: e.target.value }))}
              className="w-full h-10 rounded-lg border px-3 text-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              <option value="">Select crop...</option>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Price per kg (TZS) *</Label>
            <Input type="number" min={0} value={form.price_per_kg || ''} onChange={e => setForm(f => ({ ...f, price_per_kg: Number(e.target.value) }))} placeholder="e.g. 650" />
          </div>
          <div className="space-y-1.5">
            <Label>Market Location *</Label>
            <select value={form.market_location} onChange={e => setForm(f => ({ ...f, market_location: e.target.value }))}
              className="w-full h-10 rounded-lg border px-3 text-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              <option value="">Select location...</option>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm} onClose={() => setConfirm(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Price Entry"
        description="This will permanently remove this market price entry. This action cannot be undone." />
    </div>
  )
}
