import { Component } from "react";
import { useLocation } from "react-router-dom";

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error("Erro de renderização:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="route-error" role="alert">
          <h1>Algo deu errado nesta página</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
}