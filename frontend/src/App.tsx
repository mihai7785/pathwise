import { useState } from 'react'

import { Sidebar } from './components/Sidebar'
import { useAuth } from './lib/auth'
import { LoginPage } from './pages/LoginPage'
import { CopilotPage } from './pages/CopilotPage'
import { DashboardPage } from './pages/DashboardPage'
import { InboxPage } from './pages/InboxPage'
import { PathPage } from './pages/PathPage'
import { TopicPage } from './pages/TopicPage'

type View = 'dashboard' | 'path' | 'topic' | 'inbox' | 'copilot'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const { session, isAuthenticated, setSession, clearSession } = useAuth()

  if (!isAuthenticated || !session) {
    return <LoginPage onLogin={setSession} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        current={view}
        onChange={setView}
        userName={session.user.name}
        userEmail={session.user.email}
        onLogout={clearSession}
      />
      <main className="content">
        {view === 'dashboard' && <DashboardPage />}
        {view === 'path' && <PathPage onOpenTopic={(topicId) => { setSelectedTopicId(topicId); setView('topic') }} />}
        {view === 'topic' && (
          <TopicPage
            topicId={selectedTopicId}
            onTopicDeleted={() => {
              setSelectedTopicId(null)
              setView('path')
            }}
          />
        )}
        {view === 'inbox' && <InboxPage />}
        {view === 'copilot' && <CopilotPage />}
      </main>
    </div>
  )
}
