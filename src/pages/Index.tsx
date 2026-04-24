import { useState } from "react";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { MonthlySpending } from "@/components/dashboard/MonthlySpending";
import { FinancialHealthCard } from "@/components/dashboard/FinancialHealthCard";
import { UpcomingCommitments } from "@/components/dashboard/UpcomingCommitments";
import { Activity } from "@/components/dashboard/Activity";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { FinancialCalendar } from "@/components/dashboard/FinancialCalendar";
import { NewTransactionDialog } from "@/components/dashboard/NewTransactionDialog";
import { useProfile } from "@/store/profile";

const Index = () => {
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 py-4 pb-24 sm:p-4 md:p-6 md:pb-6 lg:p-8 max-w-[1500px] mx-auto w-full overflow-x-hidden">
        <Header userName={profile.nome} onNewTransaction={() => setOpen(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Coluna esquerda (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <NetWorthCard />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              <MonthlySpending />
              <FinancialHealthCard />
            </div>
            <UpcomingCommitments />
          </div>

          {/* Coluna direita (1/3) */}
          <div className="flex flex-col gap-5">
            <Activity />
            <AIInsights />
            <FinancialCalendar />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Nova Transação"
          style={{ bottom: "calc(var(--mobile-nav-h) + 1rem)" }}
          className="md:hidden fixed right-4 z-50 h-14 px-5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_18px_40px_hsl(var(--primary)/0.35)] flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Nova Transação</span>
        </button>

        <NewTransactionDialog open={open} onOpenChange={setOpen} />
      </main>
    </div>
  );
};

export default Index;
