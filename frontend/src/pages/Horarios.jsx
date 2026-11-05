import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  LoaderCircle,
  RotateCcw,
  Save,
  UserCog,
} from "lucide-react";
import api from "../services/api";
import HorariosEditor from "../components/HorariosEditor";
import {
  normalizarSemana,
  serializarSemana,
  validarSemanaLocal,
} from "../utils/horarios";

function Horarios() {
  const [horariosEmpresa, setHorariosEmpresa] = useState(
    normalizarSemana([]),
  );
  const [carregandoEmpresa, setCarregandoEmpresa] = useState(true);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [erroEmpresa, setErroEmpresa] = useState("");
  const [sucessoEmpresa, setSucessoEmpresa] = useState("");

  const [profissionais, setProfissionais] = useState([]);
  const [profissionalId, setProfissionalId] = useState("");
  const [horariosProfissional, setHorariosProfissional] = useState(
    normalizarSemana([]),
  );
  const [origemProfissional, setOrigemProfissional] = useState("EMPRESA");
  const [carregandoProfissional, setCarregandoProfissional] = useState(false);
  const [salvandoProfissional, setSalvandoProfissional] = useState(false);
  const [restaurandoProfissional, setRestaurandoProfissional] = useState(false);
  const [erroProfissional, setErroProfissional] = useState("");
  const [sucessoProfissional, setSucessoProfissional] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      const [resultadoHorarios, resultadoProfissionais] =
        await Promise.allSettled([
          api.get("/horarios", { signal: controller.signal }),
          api.get("/profissionais", { signal: controller.signal }),
        ]);

      if (controller.signal.aborted) return;

      if (resultadoHorarios.status === "fulfilled") {
        setHorariosEmpresa(normalizarSemana(resultadoHorarios.value.data));
      } else {
        setErroEmpresa(
          resultadoHorarios.reason.response?.data?.mensagem ||
            "Não foi possível carregar os horários da empresa.",
        );
      }

      if (resultadoProfissionais.status === "fulfilled") {
        const lista = Array.isArray(resultadoProfissionais.value.data)
          ? resultadoProfissionais.value.data
          : [];
        setProfissionais(lista.filter((item) => Boolean(item.ativo)));
      }

      setCarregandoEmpresa(false);
    }

    void carregar();

    return () => controller.abort();
  }, []);

  function atualizarDiaEmpresa(diaSemana, campo, valor) {
    setSucessoEmpresa("");
    setErroEmpresa("");
    setHorariosEmpresa((atuais) =>
      atuais.map((dia) =>
        dia.dia_semana === diaSemana ? { ...dia, [campo]: valor } : dia,
      ),
    );
  }

  async function salvarHorariosEmpresa(event) {
    event.preventDefault();
    setErroEmpresa("");
    setSucessoEmpresa("");

    const problema = validarSemanaLocal(horariosEmpresa);

    if (problema) {
      setErroEmpresa(problema);
      return;
    }

    try {
      setSalvandoEmpresa(true);

      await Promise.all(
        serializarSemana(horariosEmpresa).map((dia) =>
          api.post("/horarios", dia),
        ),
      );

      setSucessoEmpresa("Horário padrão da empresa salvo com sucesso.");
    } catch (error) {
      setErroEmpresa(
        error.response?.data?.mensagem ||
          "Não foi possível salvar os horários da empresa.",
      );
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  async function selecionarProfissional(event) {
    const id = event.target.value;

    setProfissionalId(id);
    setErroProfissional("");
    setSucessoProfissional("");

    if (!id) {
      setHorariosProfissional(normalizarSemana([]));
      setOrigemProfissional("EMPRESA");
      return;
    }

    try {
      setCarregandoProfissional(true);

      const response = await api.get(
        `/horarios-profissionais/profissional/${id}`,
      );

      setHorariosProfissional(
        normalizarSemana(response.data?.horarios),
      );
      setOrigemProfissional(response.data?.origem || "EMPRESA");
    } catch (error) {
      setErroProfissional(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os horários deste profissional.",
      );
    } finally {
      setCarregandoProfissional(false);
    }
  }

  function atualizarDiaProfissional(diaSemana, campo, valor) {
    setSucessoProfissional("");
    setErroProfissional("");
    setHorariosProfissional((atuais) =>
      atuais.map((dia) =>
        dia.dia_semana === diaSemana ? { ...dia, [campo]: valor } : dia,
      ),
    );
  }

  async function salvarHorariosProfissional(event) {
    event.preventDefault();
    setErroProfissional("");
    setSucessoProfissional("");

    const problema = validarSemanaLocal(horariosProfissional);

    if (problema) {
      setErroProfissional(problema);
      return;
    }

    try {
      setSalvandoProfissional(true);

      const response = await api.put(
        `/horarios-profissionais/profissional/${profissionalId}`,
        { horarios: serializarSemana(horariosProfissional) },
      );

      setHorariosProfissional(
        normalizarSemana(response.data?.horarios),
      );
      setOrigemProfissional(response.data?.origem || "PROFISSIONAL");
      setSucessoProfissional(
        response.data?.mensagem ||
          "Horários do profissional salvos com sucesso.",
      );
    } catch (error) {
      setErroProfissional(
        error.response?.data?.mensagem ||
          "Não foi possível salvar os horários deste profissional.",
      );
    } finally {
      setSalvandoProfissional(false);
    }
  }

  async function restaurarHorarioEmpresa() {
    const confirmado = window.confirm(
      "Isso remove os horários próprios deste profissional e volta a usar o horário padrão da empresa. Continuar?",
    );

    if (!confirmado) return;

    setErroProfissional("");
    setSucessoProfissional("");

    try {
      setRestaurandoProfissional(true);

      const response = await api.delete(
        `/horarios-profissionais/profissional/${profissionalId}`,
      );

      setHorariosProfissional(
        normalizarSemana(response.data?.horarios),
      );
      setOrigemProfissional(response.data?.origem || "EMPRESA");
      setSucessoProfissional(
        response.data?.mensagem ||
          "O profissional voltou a usar o horário da empresa.",
      );
    } catch (error) {
      setErroProfissional(
        error.response?.data?.mensagem ||
          "Não foi possível restaurar o horário da empresa.",
      );
    } finally {
      setRestaurandoProfissional(false);
    }
  }

  const bloqueadoEmpresa = carregandoEmpresa || salvandoEmpresa;

  const bloqueadoProfissional =
    carregandoProfissional ||
    salvandoProfissional ||
    restaurandoProfissional;

  return (
    <div className="page-content horarios-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">DISPONIBILIDADE</p>
          <h1>Horários</h1>
          <p className="page-description">
            Defina o horário padrão da empresa e, se precisar, personalize o
            atendimento de cada profissional.
          </p>
        </div>
      </header>

      <section className="business-hours-card">
        <div className="business-hours-header">
          <div className="business-hours-icon">
            <Building2 size={19} />
          </div>
          <div>
            <h2>Horário padrão da empresa</h2>
            <p>
              Vale para todos os profissionais que não possuem horário próprio.
            </p>
          </div>
        </div>

        {erroEmpresa && (
          <div
            className="business-hours-message business-hours-error"
            role="alert"
          >
            {erroEmpresa}
          </div>
        )}
        {sucessoEmpresa && (
          <div
            className="business-hours-message business-hours-success"
            role="status"
          >
            <Check size={16} />
            {sucessoEmpresa}
          </div>
        )}

        {carregandoEmpresa ? (
          <div className="business-hours-loading" role="status">
            <LoaderCircle size={20} className="business-hours-spinner" />
            Carregando horários...
          </div>
        ) : (
          <form onSubmit={salvarHorariosEmpresa}>
            <HorariosEditor
              horarios={horariosEmpresa}
              onChange={atualizarDiaEmpresa}
              disabled={bloqueadoEmpresa}
            />

            <div className="business-hours-actions">
              <span className="business-hours-note">
                As alterações valem para novos agendamentos.
              </span>
              <button
                type="submit"
                className="primary-button business-hours-save"
                disabled={bloqueadoEmpresa}
              >
                {salvandoEmpresa ? (
                  <LoaderCircle
                    size={16}
                    className="business-hours-spinner"
                  />
                ) : (
                  <Save size={16} />
                )}
                {salvandoEmpresa ? "Salvando..." : "Salvar horários"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="business-hours-card">
        <div className="business-hours-header">
          <div className="business-hours-icon">
            <UserCog size={19} />
          </div>
          <div>
            <h2>Horários por profissional</h2>
            <p>
              Personalize a agenda de um profissional. Sem horários próprios,
              ele usa o padrão da empresa.
            </p>
          </div>
        </div>

        {profissionais.length === 0 ? (
          <div className="business-hours-loading" role="status">
            Cadastre um profissional para personalizar os horários.
          </div>
        ) : (
          <div className="horarios-toolbar">
            <label className="settings-field">
              <span>Profissional</span>
              <select
                value={profissionalId}
                onChange={selecionarProfissional}
                disabled={bloqueadoProfissional}
              >
                <option value="">Selecione um profissional</option>
                {profissionais.map((profissional) => (
                  <option key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {erroProfissional && (
          <div
            className="business-hours-message business-hours-error"
            role="alert"
          >
            {erroProfissional}
          </div>
        )}
        {sucessoProfissional && (
          <div
            className="business-hours-message business-hours-success"
            role="status"
          >
            <Check size={16} />
            {sucessoProfissional}
          </div>
        )}

        {profissionalId &&
          (carregandoProfissional ? (
            <div className="business-hours-loading" role="status">
              <LoaderCircle size={20} className="business-hours-spinner" />
              Carregando horários do profissional...
            </div>
          ) : (
            <form onSubmit={salvarHorariosProfissional}>
              <div
                className={`horarios-origem ${
                  origemProfissional === "PROFISSIONAL" ? "is-proprio" : ""
                }`}
              >
                {origemProfissional === "PROFISSIONAL"
                  ? "Este profissional usa horários próprios, diferentes do padrão da empresa."
                  : "Este profissional usa o horário padrão da empresa. Ao salvar, passa a ter horários próprios."}
              </div>

              <HorariosEditor
                horarios={horariosProfissional}
                onChange={atualizarDiaProfissional}
                disabled={bloqueadoProfissional}
              />

              <div className="business-hours-actions">
                {origemProfissional === "PROFISSIONAL" && (
                  <button
                    type="button"
                    className="horarios-secondary-button"
                    onClick={restaurarHorarioEmpresa}
                    disabled={bloqueadoProfissional}
                  >
                    {restaurandoProfissional ? (
                      <LoaderCircle
                        size={16}
                        className="business-hours-spinner"
                      />
                    ) : (
                      <RotateCcw size={16} />
                    )}
                    {restaurandoProfissional
                      ? "Restaurando..."
                      : "Usar horário da empresa"}
                  </button>
                )}

                <button
                  type="submit"
                  className="primary-button business-hours-save"
                  disabled={bloqueadoProfissional}
                >
                  {salvandoProfissional ? (
                    <LoaderCircle
                      size={16}
                      className="business-hours-spinner"
                    />
                  ) : (
                    <Save size={16} />
                  )}
                  {salvandoProfissional
                    ? "Salvando..."
                    : "Salvar horários"}
                </button>
              </div>
            </form>
          ))}
      </section>
    </div>
  );
}

export default Horarios;
