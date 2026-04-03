import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopContextBar } from "@/components/shell/top-context-bar";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-surface text-ink">
      <AppSidebar />
      <div className="min-h-screen pl-sidebar">
        <TopContextBar />
        <main className="min-h-[calc(100vh-5rem)] bg-surface">
          <div className="relative mx-auto w-full max-w-content px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
            {children}
          </div>
        </main>
      </div>
      <div
        className="pointer-events-none fixed bottom-[-4rem] right-[-1rem] select-none font-headline text-[clamp(4rem,15vw,10rem)] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
        aria-hidden
      >
        LEDGER
      </div>
    </div>
  );
}
