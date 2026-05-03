type PlaybookStep = { label: string; detail: string; doneWhen?: string }

export function PlaybookSection({ title, summary, steps, nextCheck }: {
  title: string; summary: string; steps: PlaybookStep[]; nextCheck: string
}) {
  return (
    <section className="card playbook" style={{ marginBottom: 14 }}>
      <div className="eyebrow">PLAYBOOK MODE</div>
      <h2>{title}</h2>
      <p className="muted">{summary}</p>
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={i}>
            <b>{step.label}</b>
            <p>{step.detail}</p>
            {step.doneWhen && <small>Done kalau: {step.doneWhen}</small>}
          </li>
        ))}
      </ol>
      <div className="nextCheck">Next check: {nextCheck}</div>
    </section>
  )
}
