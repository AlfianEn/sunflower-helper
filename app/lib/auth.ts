import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE = 'sunflower_session'
function secret() { return process.env.SESSION_SECRET || 'dev-secret' }
function sign(v: string) { return createHmac('sha256', secret()).update(v).digest('hex') }
export async function isAuthed() {
  const c = (await cookies()).get(COOKIE)?.value
  if (!c) return false
  const [v, sig] = c.split('.')
  if (!v || !sig) return false
  const expected = sign(v)
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}
export async function login(password: string) {
  if (password !== (process.env.APP_PASSWORD || 'sunflower')) return false
  const v = String(Date.now())
  ;(await cookies()).set(COOKIE, `${v}.${sign(v)}`, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return true
}
export async function logout() { (await cookies()).delete(COOKIE) }
