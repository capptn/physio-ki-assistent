import { Header } from '@/components/header'
import { Chat } from '@/components/chat'

export default function HomePage() {
  return (
    <main className="flex flex-col h-dvh">
      <Header />
      <Chat />
    </main>
  )
}
