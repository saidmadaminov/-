import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ChatClient from "@/components/ChatClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-400">…</div>}>
      <ChatClient />
    </Suspense>
  );
}
