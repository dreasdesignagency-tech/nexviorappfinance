import { Bell, CheckCheck, Trash2, AlertTriangle, Target, CreditCard, Repeat, HeartPulse } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAlerts, type AlertType } from "@/store/alerts";
import { cn } from "@/lib/utils";

const iconFor = (type: AlertType) => {
  if (type.startsWith("limit")) return AlertTriangle;
  if (type.startsWith("goal")) return Target;
  if (type.startsWith("subscription")) return Repeat;
  if (type.startsWith("installment")) return CreditCard;
  if (type.startsWith("health")) return HeartPulse;
  return Bell;
};

const formatRelative = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
};

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useAlerts();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative w-9 h-9 md:w-10 md:h-10 rounded-full glass-inner flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-primary to-primary-glow text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[92vw] max-w-[380px] p-0 glass-card border-border/40 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-[11px] text-muted-foreground">{unreadCount} não lida{unreadCount === 1 ? "" : "s"}</p>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Marcar todas como lidas"
                className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center text-muted-foreground hover:text-foreground transition"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                title="Limpar todas"
                className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center text-muted-foreground hover:text-destructive transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl glass-inner mx-auto mb-3 flex items-center justify-center">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Tudo em dia</p>
              <p className="text-xs text-muted-foreground mt-1">Você não tem novas notificações.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {notifications.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={cn(
                        "w-full text-left flex items-start gap-3 p-3 hover:bg-surface-elevated/40 transition-colors",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl glass-inner flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{formatRelative(n.created_at)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
