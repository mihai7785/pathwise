type View = 'dashboard' | 'path' | 'topic' | 'inbox' | 'copilot'

type Props = {
  current: View
  onChange: (view: View) => void
}

const items: View[] = ['dashboard', 'path', 'topic', 'inbox', 'copilot']

export function Sidebar({ current, onChange }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">Learning Copilot</div>
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
    </aside>
  )
}
