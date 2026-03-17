import { Header } from "@/components/header";
import { Chat } from "@/components/chat";
import { AuthGuard } from "@/components/auth-guard";
import { SubscriptionGuard } from "@/components/subscription-guard";

export default function ChatPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <main className="flex flex-col h-dvh bg-background">
          <Header />
          <Chat />
        </main>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
