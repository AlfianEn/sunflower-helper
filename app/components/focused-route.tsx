type Step = { title: string; where: string; why: string; done: string; tone?: string }

export function FocusedRoute({ title, where, why, done, steps }: {
  title: string; where: string; why: string; done: string; steps: Step[]
}) {
  return (
    <section className="card simpleHero" style={{ marginBottom: 14 }}>
      <div className="eyebrow">FOCUSED ROUTE</div>
      <h1>{title}</h1>
      <div className="simpleGrid">
        <div><b>Di mana?</b><p>{where}</p></div>
        <div><b>Kenapa?</b><p>{why}</p></div>
        <div><b>Selesai kalau</b><p>{done}</p></div>
      </div>
      <h3>Urutan main sekarang</h3>
      <ol className="simpleSteps">
        {steps.map((s, i) => (
          <li className={s.tone || ''} key={i}>
            <span className="stepNo">{i + 1}</span>
            <b>{s.title}</b>
            <span>{s.where}</span>
            <small>{s.why}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}
