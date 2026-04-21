import { Plus } from "lucide-react";
import { useState } from "react";

const contacts = [
  { name: "Maya", color: "from-pink-400 to-rose-500" },
  { name: "David", color: "from-blue-400 to-indigo-500" },
  { name: "Sophie", color: "from-amber-400 to-orange-500" },
  { name: "Lucas", color: "from-emerald-400 to-teal-500" },
];

export const SendMoney = () => {
  const [tab, setTab] = useState<"recent" | "favorites">("recent");

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Enviar dinheiro</h3>
        <div className="glass-inner rounded-full p-0.5 flex text-xs">
          <button
            onClick={() => setTab("recent")}
            className={`px-3 py-1 rounded-full transition ${tab === "recent" ? "bg-surface-elevated text-foreground" : "text-muted-foreground"}`}
          >
            Recente
          </button>
          <button
            onClick={() => setTab("favorites")}
            className={`px-3 py-1 rounded-full transition ${tab === "favorites" ? "bg-surface-elevated text-foreground" : "text-muted-foreground"}`}
          >
            Favoritos
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button className="w-10 h-10 rounded-full glass-inner flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Plus className="w-4 h-4" />
        </button>
        {contacts.map((c) => (
          <div key={c.name} className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} ring-2 ring-border/40`} />
            <span className="text-[10px] text-muted-foreground">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold tracking-tight">R$ 250,00</p>
        <button className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-105 transition-transform">
          Transferir
        </button>
      </div>
    </div>
  );
};
