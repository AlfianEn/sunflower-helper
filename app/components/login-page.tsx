import { loginAction } from './actions'

export function LoginPage({ bad }: { bad?: boolean }) {
  return (
    <main className="wrap">
      <div className="card loginCard">
        <div className="loginLogo">🌻</div>
        <div className="big">Sunflower Helper</div>
        <p className="muted">Private planner for Sunflower Land.</p>
        <form action={loginAction} className="loginForm">
          <input name="password" type="password" placeholder="Password" autoFocus />
          <button>Login</button>
        </form>
        {bad && <p className="warn">Wrong password.</p>}
      </div>
    </main>
  )
}
