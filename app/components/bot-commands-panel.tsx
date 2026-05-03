export function BotCommandsPanel() {
  return (
    <section className="card compact" style={{ marginTop: 14 }}>
      <div className="eyebrow">TELEGRAM BOT COMMANDS</div>
      <h2>Quick Commands</h2>
      <p className="muted">Kirim command ini ke Telegram bot untuk info cepat.</p>

      <div className="commandGrid">
        <div className="commandCard">
          <code>/farm</code>
          <span>Status farm lengkap: plots, cooking, resources, delivery</span>
        </div>
        <div className="commandCard">
          <code>/profit</code>
          <span>Profit hari ini: SFL earned, crops, deliveries</span>
        </div>
        <div className="commandCard">
          <code>/next</code>
          <span>Event berikutnya: crop ready, cooking, resources</span>
        </div>
        <div className="commandCard">
          <code>/efficiency</code>
          <span>Skor efisiensi farm + tips perbaikan</span>
        </div>
      </div>
    </section>
  )
}
