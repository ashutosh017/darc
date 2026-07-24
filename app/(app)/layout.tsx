import { Sidebar } from "@/components/Sidebar";
import { ChatProvider } from "@/lib/chat-context";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChatProvider>
      <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-hidden bg-[#0C0A09]">
          {children}
        </main>
      </div>
    </ChatProvider>
  );
}
