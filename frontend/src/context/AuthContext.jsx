import { useEffect, useState } from "react";
import { AuthContext } from "./contextValue";
import api from "../services/api";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const usuarioSalvo = localStorage.getItem("usuario");
      return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });
  const [empresa, setEmpresa] = useState(null);
  const [empresaErro, setEmpresaErro] = useState("");

  useEffect(() => {
    function sincronizarSessao(event) {
      if (event.key && event.key !== "token" && event.key !== "usuario") {
        return;
      }

      let usuarioAtual;

      try {
        const usuarioSalvo = localStorage.getItem("usuario");
        usuarioAtual = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
      } catch {
        usuarioAtual = null;
      }

      setToken(localStorage.getItem("token") || null);
      setUsuario(usuarioAtual);
      setEmpresa(null);
      setEmpresaErro("");
    }

    window.addEventListener("storage", sincronizarSessao);
    return () => window.removeEventListener("storage", sincronizarSessao);
  }, []);

  useEffect(() => {
    if (!token || !usuario?.empresa_id) {
      return undefined;
    }

    const controller = new AbortController();

    async function carregarEmpresa() {
      try {
        const response = await api.get("/empresas", {
          signal: controller.signal,
        });
        const empresas = response.data;

        if (!Array.isArray(empresas)) {
          throw new Error("A resposta da empresa está em formato inválido.");
        }

        const empresaDoUsuario = empresas.find(
          (item) => Number(item.id) === Number(usuario.empresa_id),
        );

        if (!empresaDoUsuario) {
          throw new Error("A empresa do usuário não foi encontrada.");
        }

        if (!controller.signal.aborted) {
          setEmpresa(empresaDoUsuario);
          setEmpresaErro("");
        }
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;

        console.error("Não foi possível carregar a empresa do usuário:", error);
        setEmpresa(null);
        setEmpresaErro(
          error.response?.data?.mensagem ||
            "Não foi possível carregar os dados da empresa.",
        );
      }
    }

    void carregarEmpresa();

    return () => {
      controller.abort();
    };
  }, [token, usuario?.empresa_id]);

  async function login(email, senha) {
    const response = await api.post("/auth/login", {
      email,
      senha,
    });

    const { token, usuario } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

    setToken(token);
    setUsuario(usuario);
    setEmpresa(null);
    setEmpresaErro("");

    return usuario;
  }

  async function cadastro(dados) {
    const response = await api.post("/auth/cadastro", dados);
    const {
      token: novoToken,
      usuario: novoUsuario,
      empresa: novaEmpresa,
    } = response.data;

    localStorage.setItem("token", novoToken);
    localStorage.setItem("usuario", JSON.stringify(novoUsuario));
    setToken(novoToken);
    setUsuario(novoUsuario);
    setEmpresa(novaEmpresa || null);
    setEmpresaErro("");

    return novoUsuario;
  }

  async function atualizarUsuario(dados) {
    const response = await api.put("/usuarios/me", dados);
    const usuarioAtualizado = response.data.usuario;

    localStorage.setItem("usuario", JSON.stringify(usuarioAtualizado));
    setUsuario(usuarioAtualizado);

    return usuarioAtualizado;
  }

  async function atualizarNomeEmpresa(nome) {
    const response = await api.get("/configuracoes");
    const configuracoes = response.data;

    await api.put("/configuracoes", {
      nome,
      slug: configuracoes.slug,
      telefone: configuracoes.telefone,
      email: configuracoes.email,
      descricao: configuracoes.descricao,
      endereco: configuracoes.endereco,
      instagram: configuracoes.instagram,
      agendamento_online: configuracoes.agendamento_online,
      antecedencia_minutos: configuracoes.antecedencia_minutos,
      permitir_cancelamento: configuracoes.permitir_cancelamento,
      permitir_reagendamento: configuracoes.permitir_reagendamento,
    });

    setEmpresa((atual) => ({
      ...atual,
      nome,
    }));

    return { ...configuracoes, nome };
  }

  function atualizarEmpresaContexto(dados) {
    setEmpresa((atual) => ({
      ...(atual || {}),
      id: dados.id || atual?.id,
      nome: dados.nome ?? atual?.nome,
    }));
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setToken(null);
    setUsuario(null);
    setEmpresa(null);
    setEmpresaErro("");
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        empresa,
        empresaErro,
        login,
        cadastro,
        atualizarUsuario,
        atualizarNomeEmpresa,
        atualizarEmpresaContexto,
        logout,
        autenticado: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}