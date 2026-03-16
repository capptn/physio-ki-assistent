import { Header } from '@/components/header'
import { Chat } from '@/components/chat'
import { AuthGuard } from '@/components/auth-guard'

export default function HomePage() {
  return (
    <AuthGuard>
    <main className="flex flex-col h-dvh">
      <Header />
      <Chat />
    </main>
    </AuthGuard>
  )
}
