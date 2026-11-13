import {
    BrowserRouter,
    Route,
    Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";

import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Recuperacao from "./pages/Recuperacao";
import Servicos from "./pages/Servicos";
import Profissionais from "./pages/Profissionais";
import Horarios from "./pages/Horarios";
import MeusHorarios from "./pages/MeusHorarios";

import PaginaAgendamento from "./pages/PaginaAgendamento";
import Configuracoes from "./pages/Configuracoes";
import MinhaConta from "./pages/MinhaConta";

import Assinatura from "./pages/Assinatura";
import AssinaturaSucesso from "./pages/AssinaturaSucesso";
import AssinaturaCancelado from "./pages/AssinaturaCancelado";
import AssinaturaExpirada from "./pages/AssinaturaExpirada";

import OnboardingEmpresa from "./pages/OnboardingEmpresa";
import InicioProfissional from "./pages/InicioProfissional";
import MeusClientes from "./pages/MeusClientes";
import AceitarConvite from "./pages/AceitarConvite";

import PublicAgendamento from "./pages/PublicAgendamento";
import PublicAgendamentoConfirmado from "./pages/PublicAgendamentoConfirmado";
import PublicAgendamentoGerenciar from "./pages/PublicAgendamentoGerenciar";

import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Cookies from "./pages/Cookies";
import Cancelamento from "./pages/Cancelamento";

import ProtectedRoute from "./routes/ProtectedRoute";
import SubscriptionGate from "./routes/SubscriptionGate";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =====================================================
                    ROTAS PÚBLICAS
                ====================================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/cadastro"
                    element={<Cadastro />}
                />

                <Route
                    path="/esqueci-senha"
                    element={<EsqueciSenha />}
                />

                <Route
                    path="/redefinir-senha/:token"
                    element={<RedefinirSenha />}
                />

                <Route
                    path="/convite/:token"
                    element={<AceitarConvite />}
                />

                {/* =====================================================
                    DOCUMENTOS LEGAIS (PÚBLICOS)
                ====================================================== */}

                <Route
                    path="/termos"
                    element={<Termos />}
                />

                <Route
                    path="/privacidade"
                    element={<Privacidade />}
                />

                <Route
                    path="/cookies"
                    element={<Cookies />}
                />

                <Route
                    path="/cancelamento"
                    element={<Cancelamento />}
                />

                {/* AGENDAMENTO PÚBLICO */}

                <Route
                    path="/agendar/:slug"
                    element={<PublicAgendamento />}
                />

                <Route
                    path="/agendar/:slug/confirmado/:token"
                    element={<PublicAgendamentoConfirmado />}
                />

                <Route
                    path="/agendar/:slug/agendamento/:token"
                    element={<PublicAgendamentoGerenciar />}
                />

                {/* =====================================================
                    RETORNO DO ASAAS
                ====================================================== */}

                <Route
                    path="/assinatura/sucesso"
                    element={<AssinaturaSucesso />}
                />

                <Route
                    path="/assinatura/cancelado"
                    element={<AssinaturaCancelado />}
                />

                <Route
                    path="/assinatura/expirado"
                    element={<AssinaturaExpirada />}
                />

                {/* =====================================================
                    ROTAS PROTEGIDAS
                ====================================================== */}

                <Route element={<ProtectedRoute />}>

                    {/* =================================================
                        ASSINATURA (FORA DO PAINEL)
                    ================================================== */}

                    <Route
                        path="/assinatura"
                        element={
                            <div className="assinatura-standalone">
                                <Assinatura />
                            </div>
                        }
                    />

                    {/* =================================================
                        GATE DE ASSINATURA
                    ================================================== */}

                    <Route element={<SubscriptionGate />}>

                    <Route element={<DashboardLayout />}>

                        {/* =================================================
                            ROTAS ADMIN
                        ================================================== */}

                        <Route
                            element={
                                <ProtectedRoute
                                    roles={["ADMIN"]}
                                />
                            }
                        >
                            <Route
                                path="/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/clientes"
                                element={<Clientes />}
                            />

                            <Route
                                path="/recuperacao"
                                element={<Recuperacao />}
                            />

                            <Route
                                path="/servicos"
                                element={<Servicos />}
                            />

                            <Route
                                path="/profissionais"
                                element={<Profissionais />}
                            />

                            <Route
                                path="/horarios"
                                element={<Horarios />}
                            />

                            <Route
                                path="/configuracoes"
                                element={<Configuracoes />}
                            />
                        </Route>

                        {/* =================================================
                            AGENDA
                        ================================================== */}

                        <Route
                            path="/agenda"
                            element={<Agenda />}
                        />

                        {/* =================================================
                            ADMIN + PROFISSIONAL
                        ================================================== */}

                        <Route
                            element={
                                <ProtectedRoute
                                    roles={[
                                        "ADMIN",
                                        "PROFISSIONAL",
                                    ]}
                                />
                            }
                        >
                            <Route
                                path="/pagina-agendamento"
                                element={<PaginaAgendamento />}
                            />
                        </Route>

                        {/* =================================================
                            PROFISSIONAL
                        ================================================== */}

                        <Route
                            element={
                                <ProtectedRoute
                                    roles={["PROFISSIONAL"]}
                                />
                            }
                        >
                            <Route
                                path="/inicio"
                                element={<InicioProfissional />}
                            />

                            <Route
                                path="/meus-horarios"
                                element={<MeusHorarios />}
                            />

                            <Route
                                path="/meus-clientes"
                                element={<MeusClientes />}
                            />
                        </Route>

                        {/* =================================================
                            MINHA CONTA
                        ================================================== */}

                        <Route
                            path="/minha-conta"
                            element={<MinhaConta />}
                        />

                    </Route>

                    {/* =====================================================
                        ONBOARDING ADMIN
                    ====================================================== */}

                    <Route
                        element={
                            <ProtectedRoute
                                roles={["ADMIN"]}
                            />
                        }
                    >
                        <Route
                            path="/onboarding"
                            element={<OnboardingEmpresa />}
                        />
                    </Route>

                    </Route>
                    {/* fim do gate de assinatura */}

                </Route>

                {/* =====================================================
                    FALLBACK
                ====================================================== */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="*"
                    element={<Login />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;