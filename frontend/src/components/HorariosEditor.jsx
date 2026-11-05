function HorariosEditor({ horarios, onChange, disabled }) {
  return (
    <div className="business-hours-list">
      {horarios.map((dia) => (
        <div className="business-hours-row" key={dia.dia_semana}>
          <div className="business-hours-day">{dia.nome}</div>
          <label className="business-hours-toggle">
            <input
              type="checkbox"
              checked={dia.ativo}
              disabled={disabled}
              onChange={(event) =>
                onChange(dia.dia_semana, "ativo", event.target.checked)
              }
            />
            <span className="business-hours-toggle-mark" />
            <span>{dia.ativo ? "Aberto" : "Fechado"}</span>
          </label>
          {dia.ativo ? (
            <div className="business-hours-times">
              <input
                type="time"
                aria-label={`${dia.nome}: hora de abertura`}
                value={dia.hora_abertura}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    dia.dia_semana,
                    "hora_abertura",
                    event.target.value,
                  )
                }
              />
              <span>até</span>
              <input
                type="time"
                aria-label={`${dia.nome}: hora de fechamento`}
                value={dia.hora_fechamento}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    dia.dia_semana,
                    "hora_fechamento",
                    event.target.value,
                  )
                }
              />
            </div>
          ) : (
            <span className="business-hours-closed">Sem atendimento</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default HorariosEditor;
