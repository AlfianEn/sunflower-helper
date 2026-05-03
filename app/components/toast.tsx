export function Toasts({ telegram, bad }: { telegram?: string; bad?: string }) {
  return (
    <>
      {telegram === 'ok' && <section className="card ok" style={{ marginTop: 14 }}>Telegram test sent.</section>}
      {telegram === 'fail' && <section className="card warn" style={{ marginTop: 14 }}>Telegram test failed. Check token/chat ID.</section>}
    </>
  )
}
