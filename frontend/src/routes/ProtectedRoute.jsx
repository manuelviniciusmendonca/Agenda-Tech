
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function inicioDoRole(role) {
    return role === "PROFISSIONAL"
        ? "/inicio"
        : "/dashboard";
}

function ProtectedRoute({ roles }) {
    const { autenticado, usuario } = useAuth();

    if (!autenticado) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(usuario?.role)) {
        return (
            <Navigate
                to={inicioDoRole(usuario?.role)}
                replace
            />
        );
    }

    return <Outlet />;
}

export function RotaInicial() {
    return <Navigate to="/login" replace />;
}

export default ProtectedRoute;
