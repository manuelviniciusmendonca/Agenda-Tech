const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Códigos devolvidos pelo backend quando a assinatura bloqueia o acesso.
const CODIGOS_ASSINATURA = new Set([
  "ASSINATURA_NAO_ENCONTRADA",
  "TRIAL_SEM_VENCIMENTO",
  "TRIAL_EXPIRADO",
  "ASSINATURA_BLOQUEADA",
  "ASSINATURA_VENCIDA",
]);

function redirecionarParaAssinatura(responseData) {
  if (!CODIGOS_ASSINATURA.has(responseData?.codigo)) {
    return;
  }

  if (window.location.pathname === "/assinatura") {
    return;
  }

  window.location.assign("/assinatura");
}

async function request(method, path, data, signal) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(signal ? { signal } : {}),
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });

    // Tenta fazer parse do JSON, se falhar retorna null
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      if (response.status === 403) {
        redirecionarParaAssinatura(responseData);
      }

      const error = new Error(
        responseData?.mensagem || "A solicitação falhou.",
      );
      error.response = { data: responseData, status: response.status };
      throw error;
    }

    return { data: responseData, status: response.status };
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    // Se já é um erro da API, repassa
    if (error.response) {
      throw error;
    }

    // Se é erro de rede ou outro, cria um erro genérico
    const networkError = new Error(
      "Erro de conexão. Verifique se o servidor está rodando."
    );
    networkError.response = { data: null, status: 0 };
    throw networkError;
  }
}

const api = {
  get: (path, options = {}) => request("GET", path, undefined, options.signal),
  post: (path, data, options = {}) =>
    request("POST", path, data, options.signal),
  put: (path, data, options = {}) => request("PUT", path, data, options.signal),
  delete: (path, data, options = {}) =>
    request("DELETE", path, data, options.signal),
};

export default api;
