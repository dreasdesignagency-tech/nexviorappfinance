import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Transacoes from "./pages/Transacoes.tsx";
import Cartoes from "./pages/Cartoes.tsx";
import Recorrentes from "./pages/Recorrentes.tsx";
import SaudeFinanceira from "./pages/SaudeFinanceira.tsx";
import Perfil from "./pages/Perfil.tsx";
import Notificacoes from "./pages/Notificacoes.tsx";
import NexIA from "./pages/NexIA.tsx";
import LimitesInvestimentos from "./pages/LimitesInvestimentos.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Landing from "./pages/Landing.tsx";
import Planos from "./pages/Planos.tsx";
import Sucesso from "./pages/Sucesso.tsx";

import AdminMembros from "./pages/AdminMembros.tsx";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { TransactionsProvider } from "@/store/transactions";
import { CardsProvider } from "@/store/cards";
import { RecurrentsProvider } from "@/store/recurrents";
import { LimitsProvider } from "@/store/limits";
import { ProfileProvider } from "@/store/profile";
import { ThemeProvider } from "@/store/theme";
import { AuthProvider } from "@/store/auth";
import { NotificationsProvider } from "@/store/notifications";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OfflineIndicator />
            <ProfileProvider>
              <TransactionsProvider>
                <CardsProvider>
                  <RecurrentsProvider>
                    <LimitsProvider>
                      <NotificationsProvider>
                        <Routes>
                        <Route path="/lp" element={<Landing />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/planos" element={<Planos />} />
                        <Route path="/sucesso" element={<Sucesso />} />
                        <Route path="/" element={<Protected><Index /></Protected>} />
                        <Route path="/transacoes" element={<Protected><Transacoes /></Protected>} />
                        <Route path="/cartoes" element={<Protected><Cartoes /></Protected>} />
                        <Route path="/recorrentes" element={<Protected><Recorrentes /></Protected>} />
                        <Route path="/limites-investimentos" element={<Protected><LimitesInvestimentos /></Protected>} />
                        <Route path="/saude-financeira" element={<Protected><SaudeFinanceira /></Protected>} />
                        <Route path="/perfil" element={<Protected><Perfil /></Protected>} />
                        <Route path="/notificacoes" element={<Protected><Notificacoes /></Protected>} />
                        <Route path="/nex-ia" element={<Protected><NexIA /></Protected>} />
                        <Route path="/admin/membros" element={<Protected><AdminRoute><AdminPasswordGate><AdminMembros /></AdminPasswordGate></AdminRoute></Protected>} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                        </Routes>
                      </NotificationsProvider>
                    </LimitsProvider>
                  </RecurrentsProvider>
                </CardsProvider>
              </TransactionsProvider>
            </ProfileProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
