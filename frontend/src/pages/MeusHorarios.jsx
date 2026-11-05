import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Clock3,
  LoaderCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import api from "../services/api";
import HorariosEditor from "../components/HorariosEditor";
import {
  normalizarSemana,
  serializarSemana,
  validarSemanaLocal,
} from "../utils/horarios";

function MeusHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [origem, setOrigem] = useState("EMPRESA");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/horarios-profissionais/me", { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setHorarios(normalizarSemana(response.data?.horarios));
        setOrigem(response.data?.origem || "EMPRESA");
        setErro("");
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === "AbortError") return;

        console.error("Não foi possível carregar seus horários:", error);
        setErro(
          error.response?.data?.mensagem ||
            "Não foi possível carregar seus horários.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, []);

  function atualizarDia(diaSemana, campo, valor) {
    setSucesso("");
    setErro("");
    setHorarios((atuais) =>
      atuais.map((dia) =>
        dia.dia_semana === diaSemana ? { ...dia, [campo]: valor } : dia,
      ),
    );
  }

  async function salvarHorarios(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const problema = validarSemanaLocal(horarios);

    if (problema) {
      setErro(problema);
      return;
    }

    try {
      setSalvando(true);

      const response = await api.put("/horarios-profissionais/me", {
        horarios: serializarSemana(horarios),
      });

      setHorarios(normalizarSemana(response.data?.horarios));
      setOrigem(response.data?.origem || "PROFISSIONAL");
      setSucesso(
        response.data?.mensagem || "Horários de atendimento salvos com sucesso.",
      );
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível salvar seus horários. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function restaurarHorarioEmpresa() {
    const confirmado = window.confirm(
      "Isso remove os seus horários próprios e volta a usar o horário padrão da empresa. Continuar?",
    );

    if (!confirmado) return;

    setErro("");
    setSucesso("");

    try {
      setRestaurando(true);

      const response = await api.delete("/horarios-profissionais/me");

      setHorarios(normalizarSemana(response.data?.horarios));
      setOrigem(response.data?.origem || "EMPRESA");
      setSucesso(
        response.data?.mensagem ||
          "Você voltou a usar o horário padrão da empresa.",
      );
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível restaurar o horário da empresa.",
      );
    } finally {
      setRestaurando(false);
    }
  }

  const bloqueado = carregando || salvando || restaurando;

  return (
    <div className="page-content horarios-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">SUA DISPONIBILIDADE</p>
          <h1>Horários</h1>
          <p className="page-description">
            Defina os dias e horários em que você atende. Seus horários valem
            apenas para a sua agenda.
          </p>
        </div>
      </header>

      <section className="business-hours-card">
        <div className="business-hours-header">
          <div className="business-hours-icon">
            <Clock3 size={19} />
          </div>
          <div>
            <h2>Meus horários de atendimento</h2>
            <p>Os clientes só conseguem agendar dentro destes horários.</p>
          </div>
        </div>

        <div
          className={`horarios-origem ${
            origem === "PROFISSIONAL" ? "is-proprio" : ""
          }`}
        >
          {origem === "PROFISSIONAL" ? (
            <>
              <Clock3 size={16} />
              Você está usando horários próprios, diferentes do padrão da
              empresa.
            </>
          ) : (
            <>
              <Building2 size={16} />
              Você está usando o horário padrão da empresa. Ao salvar, passa a
              ter horários próprios.
            </>
          )}
        </div>

        {erro && (
          <div className="business-hours-message business-hours-error" role="alert">
            {erro}
          </div>
        )}
        {sucesso && (
          <div
            className="business-hours-message business-hours-success"
            role="status"
          >
            <Check size={16} />
            {sucesso}
          </div>
        )}

        {carregando ? (
          <div className="business-hours-loading" role="status">
            <LoaderCircle size={20} className="business-hours-spinner" />
            Carregando seus horários...
          </div>
        ) : (
          <form onSubmit={salvarHorarios}>
            <HorariosEditor
              horarios={horarios}
              onChange={atualizarDia}
              disabled={bloqueado}
            />

            <div className="business-hours-actions">
              {origem === "PROFISSIONAL" && (
                <button
                  type="button"
                  className="horarios-secondary-button"
                  onClick={restaurarHorarioEmpresa}
                  disabled={bloqueado}
                >
                  {restaurando ? (
                    <LoaderCircle
                      size={16}
                      className="business-hours-spinner"
                    />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  {restaurando
                    ? "Restaurando..."
                    : "Usar horário da empresa"}
                </button>
              )}

              <button
                type="submit"
                className="primary-button business-hours-save"
                disabled={bloqueado}
              >
                {salvando ? (
                  <LoaderCircle
                    size={16}
                    className="business-hours-spinner"
                  />
                ) : (
                  <Save size={16} />
                )}
                {salvando ? "Salvando..." : "Salvar horários"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default MeusHorarios;
