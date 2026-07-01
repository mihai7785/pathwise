import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { CopilotPage } from './pages/CopilotPage'
import { DashboardPage } from './pages/DashboardPage'
import { InboxPage } from './pages/InboxPage'
import { PathPage } from './pages/PathPage'
import { TopicPage } from './pages/TopicPage'

type View = 'dashboard' | 'path' | 'topic' | 'inbox' | 'copilot'

export default function App() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <div className="app-shell">
      <Sidebar current={view} onChange={setView} />
      <main className="content">
        {view === 'dashboard' && <DashboardPage />}
        {view === 'path' && <PathPage />}
        {view === 'topic' && <TopicPage />}
        {view === 'inbox' && <InboxPage />}
        {view === 'copilot' && <CopilotPage />}
      </main>
    </div>
  )
}
