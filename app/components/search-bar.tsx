'use client'

import { useState } from 'react'

export function SearchBar({ placeholder, onSearch }: { placeholder?: string; onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')

  return (
    <div className="searchBar">
      <input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={query}
        onChange={e => { setQuery(e.target.value); onSearch(e.target.value) }}
        className="searchInput"
      />
      {query && (
        <button className="searchClear" onClick={() => { setQuery(''); onSearch('') }}>✕</button>
      )}
    </div>
  )
}
