export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function criarSemanaVazia() {
  return DIAS_SEMANA.map((nome, dia_semana) => ({
    dia_semana,
    nome,
    hora_abertura: "09:00",
    hora_fechamento: "18:00",
    ativo: false,
  }));
}

export function normalizarSemana(horarios) {
  const porDia = new Map(
    (Array.isArray(horarios) ? horarios : []).map((horario) => [
      Number(horario.dia_semana),
      horario,
    ]),
  );

  return criarSemanaVazia().map((dia) => {
    const horario = porDia.get(dia.dia_semana);

    if (!horario) return dia;

    return {
      ...dia,
      hora_abertura: horario.hora_abertura
        ? String(horario.hora_abertura).slice(0, 5)
        : "09:00",
      hora_fechamento: horario.hora_fechamento
        ? String(horario.hora_fechamento).slice(0, 5)
        : "18:00",
      ativo: Boolean(horario.ativo),
    };
  });
}

export function serializarSemana(horarios) {
  return horarios.map((dia) => ({
    dia_semana: dia.dia_semana,
    ativo: dia.ativo,
    hora_abertura: dia.ativo ? dia.hora_abertura : null,
    hora_fechamento: dia.ativo ? dia.hora_fechamento : null,
  }));
}

export function validarSemanaLocal(horarios) {
  const invalido = horarios.find(
    (dia) =>
      dia.ativo &&
      (!dia.hora_abertura ||
        !dia.hora_fechamento ||
        dia.hora_abertura >= dia.hora_fechamento),
  );

  if (!invalido) return "";

  return `Confira os horários de ${invalido.nome}: o fechamento deve ser depois da abertura.`;
}
