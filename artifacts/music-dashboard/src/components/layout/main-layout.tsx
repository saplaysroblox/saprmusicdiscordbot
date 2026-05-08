import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useRoute } from "wouter";

export function MainLayout({ children }: { children: ReactNode }) {
  const [match, params] = useRoute("/servers/:guildId/*?");
  const guildId = match ? params?.guildId : undefined;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10"></div>
      <Sidebar guildId={guildId} />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
