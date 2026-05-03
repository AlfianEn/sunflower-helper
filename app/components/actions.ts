'use server'

import { redirect } from 'next/navigation'
import { login, logout } from '../lib/auth'
import { store } from '../lib/db'
import { getCrop } from '../lib/crops'
import { sendTelegram } from '../lib/notify'

export async function loginAction(formData: FormData) {
  if (await login(String(formData.get('password') || ''))) redirect('/')
  redirect('/?bad=1')
}

export async function logoutAction() {
  await logout()
  redirect('/')
}

export async function addCrop(formData: FormData) {
  const crop = getCrop(String(formData.get('crop') || 'Sunflower'))
  const plotCount = Math.max(1, Number(formData.get('plotCount') || 1))
  const plantedRaw = String(formData.get('plantedAt') || '')
  const plantedAt = plantedRaw ? new Date(plantedRaw) : new Date()
  const harvestAt = new Date(plantedAt.getTime() + crop.minutes * 60_000)
  store.addCropPlan({ crop: crop.name, plotCount, plantedAt, harvestAt, notes: String(formData.get('notes') || '') || null })
  redirect('/')
}

export async function markDone(formData: FormData) {
  store.markDone(Number(formData.get('id')))
  redirect('/')
}

export async function saveInventory(formData: FormData) {
  store.setInventory(String(formData.get('name') || ''), Number(formData.get('qty') || 0))
  redirect('/')
}

export async function addTarget(formData: FormData) {
  store.addTarget(String(formData.get('item') || ''), Number(formData.get('qty') || 1), String(formData.get('notes') || '') || null)
  redirect('/')
}

export async function doneTarget(formData: FormData) {
  store.doneTarget(Number(formData.get('id')))
  redirect('/')
}

export async function testTelegram() {
  const r = await sendTelegram('🌻 Sunflower Helper test dari dashboard OK.')
  redirect('/?telegram=' + (r.ok ? 'ok' : 'fail'))
}

export async function setGoal(formData: FormData) {
  store.setSetting('goal', String(formData.get('goal') || 'balanced'))
  redirect('/')
}

export async function saveSettings(formData: FormData) {
  store.setSetting('farmId', String(formData.get('farmId') || ''))
  store.setSetting('telegramChatId', String(formData.get('telegramChatId') || ''))
  store.setSetting('remindReady', formData.get('remindReady') ? 'true' : 'false')
  store.setSetting('remindBeforeMinutes', String(formData.get('remindBeforeMinutes') || '0'))
  store.setSetting('dailyReminderTime', String(formData.get('dailyReminderTime') || ''))
  redirect('/')
}
