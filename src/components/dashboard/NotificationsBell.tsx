import { Bell, CheckCheck, Trash2, AlertTriangle, Target, CreditCard, Repeat, HeartPulse } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const vw = window.innerWidth;
      const width = Math.min(360, Math.max(280, vw - 24));
      let right = vw - r.right;
      if (right + width > vw - 12) right = vw - width - 12;
      if (right < 12) right = 12;
      setPos({ top: r.bottom + 8, right, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Close on outside click & ESC
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const headerEl = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div>
        <p className="text-sm font-semibold">Notificações</p>
        <p className="text-[11px] text-muted-foreground">
          {unreadCount} não lida{unreadCount === 1 ? "" : "s"}
        </p>
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
  );

  const listEl = (
    <div className="overflow-y-auto max-h-[340px]">
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
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Notificações"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 md:w-10 md:h-10 rounded-full glass-inner flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-primary to-primary-glow text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          isMobile ? (
            <div className="fixed inset-0 z-[200]">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                className="absolute left-0 right-0 bottom-0 max-h-[85vh] glass-card border-t border-border/40 rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom"
              >
                {headerEl}
                {listEl}
              </div>
            </div>
          ) : (
            <div
              ref={panelRef}
              style={{ top: pos?.top ?? 0, right: pos?.right ?? 0 }}
              className="fixed z-[200] w-[340px] glass-card border border-border/40 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
            >
              {headerEl}
              {listEl}
            </div>
          ),
          document.body,
        )}
    </>
  );
};
