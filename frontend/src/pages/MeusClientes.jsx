import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search, Users } from "lucide-react";
import api from "../services/api";

function MeusClientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarClientes = useCallback(async (signal) => {
    const response = await api.get("/clientes", { signal });
    if (!Array.isArray(response.data)) {
      throw new Error("A resposta de clientes está em formato inválido.");
    }
    return response.data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregarClientes(controller.signal)
      .then((resultado) => {
        if (!controller.signal.aborted) setClientes(resultado);
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setErro(
            error.response?.data?.mensagem ||
              error.message ||
              "Não foi possível carregar seus clientes.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, [carregarClientes]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return clientes;
    return clientes.filter((cliente) =>
      [cliente.nome, cliente.telefone, cliente.email].some((valor) =>
        String(valor || "").toLocaleLowerCase("pt-BR").includes(termo),
      ),
    );
  }, [busca, clientes]);

  return (
    <div className="professional-clients">
      <header className="page-header">
        <div>
          <p className="eyebrow">RELACIONAMENTO</p>
          <h1>Meus clientes</h1>
          <p className="page-description">
            Clientes relacionados aos seus atendimentos.
          </p>
        </div>
      </header>

      <label className="professional-clients-search">
        <Search size={17} />
        <input
          type="search"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail"
          aria-label="Buscar clientes"
        />
      </label>

      {erro ? (
        <div className="agenda-error" role="alert">{erro}</div>
      ) : carregando ? (
        <div className="professional-clients-empty" role="status">
          Carregando clientes...
        </div>
      ) : clientesFiltrados.length ? (
        <section className="professional-clients-grid" aria-label="Meus clientes">
          {clientesFiltrados.map((cliente) => (
            <article className="professional-client-card" key={cliente.id}>
              <div className="professional-client-avatar"><Users size={19} /></div>
              <h2>{cliente.nome}</h2>
              {cliente.telefone && (
                <a href={`tel:${cliente.telefone}`}><Phone size={14} />{cliente.telefone}</a>
              )}
              {cliente.email && (
                <a href={`mailto:${cliente.email}`}><Mail size={14} />{cliente.email}</a>
              )}
              {!cliente.telefone && !cliente.email && (
                <span className="professional-client-no-contact">Sem contato cadastrado</span>
              )}
            </article>
          ))}
        </section>
      ) : (
        <div className="professional-clients-empty">
          {clientes.length
            ? "Nenhum cliente corresponde à busca."
            : "Seus clientes aparecerão aqui após os atendimentos."}
        </div>
      )}
    </div>
  );
}

export default MeusClientes;
