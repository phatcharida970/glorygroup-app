'use client'
import { useState } from 'react'

export function ChipInput({ name, label, defaultValue = [], placeholder }: {
  name: string; label: string; defaultValue?: string[]; placeholder?: string
}) {
  const [chips, setChips] = useState<string[]>(defaultValue)
  const [text, setText] = useState('')
  const add = () => { const t = text.trim(); if (t && !chips.includes(t)) setChips([...chips, t]); setText('') }
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {chips.map((c, i) => <input key={i} type="hidden" name={name} value={c} />)}
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 rounded-full px-3 py-1 text-sm">
            {c}<button type="button" onClick={() => setChips(chips.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border px-3 py-2" value={text} placeholder={placeholder}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} className="rounded-lg border px-4">เพิ่ม</button>
      </div>
    </div>
  )
}
