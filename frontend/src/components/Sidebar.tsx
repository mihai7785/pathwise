type View = 'dashboard' | 'path' | 'topic' | 'inbox' | 'copilot'

type Props = {
  current: View
  onChange: (view: View) => void
  userName: string
  userEmail: string
  onLogout: () => void
}

const items: View[] = ['dashboard', 'path', 'topic', 'inbox', 'copilot']

export function Sidebar({ current, onChange, userName, userEmail, onLogout }: Props) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">Pathwise</div>
        <nav>
          {items.map((item) => (
            <button
              key={item}
              className={current === item ? 'nav-item active' : 'nav-item'}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{userName}</strong>
          <span className="muted small">{userEmail}</span>
        </div>
        <button className="secondary-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  )
}
