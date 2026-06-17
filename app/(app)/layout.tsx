import { Sidebar } from "@/components/Sidebar";
import { ChatProvider } from "@/lib/chat-context";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChatProvider>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-hidden bg-[#131314]">
          {children}
        </main>
      </div>
    </ChatProvider>
  );
}
