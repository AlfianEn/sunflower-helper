'use client'

import { useEffect } from 'react'

type Shortcut = { key: string; description: string; action: () => void }

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const shortcut = shortcuts.find(s => s.key === e.key)
      if (shortcut) {
        e.preventDefault()
        shortcut.action()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

export function KeyboardHelp() {
  return (
    <div className="keyboardHelp">
      <h3>⌨️ Keyboard Shortcuts</h3>
      <div className="shortcutGrid">
        <div className="shortcut"><kbd>1</kbd><span>Overview</span></div>
        <div className="shortcut"><kbd>2</kbd><span>Production</span></div>
        <div className="shortcut"><kbd>3</kbd><span>Analytics</span></div>
        <div className="shortcut"><kbd>4</kbd><span>Tools</span></div>
        <div className="shortcut"><kbd>5</kbd><span>Settings</span></div>
        <div className="shortcut"><kbd>/</kbd><span>Search</span></div>
        <div className="shortcut"><kbd>?</kbd><span>Help</span></div>
      </div>
    </div>
  )
}
