import { Header } from "@/components/header";
import { Chat } from "@/components/chat";
import { AuthGuard } from "@/components/auth-guard";
import { SubscriptionGuard } from "@/components/subscription-guard";

export default function HomePage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <main className="flex flex-col h-dvh">
          <Header />
          <Chat />
        </main>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
