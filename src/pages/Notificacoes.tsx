import { Sidebar } from "@/components/dashboard/Sidebar";
import { Bell, BellOff } from "lucide-react";

const Notificacoes = () => {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl mx-auto w-full overflow-x-hidden">
        <header className="mb-6 pl-12 md:pl-0">
          <p className="text-sm text-muted-foreground">Atualizações e alertas</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notificações
          </h1>
        </header>

        <div className="glass-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl glass-inner mx-auto mb-4 flex items-center justify-center">
            <BellOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Você está em dia!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Nenhuma notificação por enquanto.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Notificacoes;
