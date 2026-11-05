import { LoaderCircle } from "lucide-react";

function LoadingSpinner({ mensagem = "Carregando..." }) {
  return (
    <div className="loading-spinner-container" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      gap: "12px"
    }}>
      <LoaderCircle size={32} className="loading-spinner-icon" style={{
        animation: "spin 1s linear infinite"
      }} />
      <span style={{ color: "#666", fontSize: "14px" }}>{mensagem}</span>
    </div>
  );
}

export default LoadingSpinner;
