'use client'

import { useState } from 'react'

export function Collapsible({ title, icon, defaultOpen = false, children }: {
  title: string; icon?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`collapsible ${open ? 'open' : ''}`}>
      <button className="collapsibleHeader" onClick={() => setOpen(!open)}>
        <span className="collapsibleTitle">
          {icon && <span className="collapsibleIcon">{icon}</span>}
          {title}
        </span>
        <span className="collapsibleArrow">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="collapsibleBody">{children}</div>}
    </div>
  )
}
