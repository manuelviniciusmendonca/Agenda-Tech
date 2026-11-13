import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/useAuth";

// Impede que o painel (sidebar, topbar e páginas) apareça
// enquanto a assinatura não estiver liberada. O backend
// continua sendo a fonte de verdade dos dados.
function SubscriptionGate() {
  const { carregandoAssinatura, bloqueado } = useAuth();

  if (carregandoAssinatura) {
    return (
      <div className="app-carregando" role="status">
        <Loader2 size={26} className="assinatura-girando" />
        <span>Verificando sua assinatura...</span>
      </div>
    );
  }

  if (bloqueado) {
    return <Navigate to="/assinatura" replace />;
  }

  return <Outlet />;
}

export default SubscriptionGate;
