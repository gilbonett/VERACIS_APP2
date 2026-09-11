export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "");

  const limited = cleaned.slice(0, 11);

  return limited
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function removeCPFMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata string para o padrão DD/MM/AAAA enquanto digita
 * @param value - String com números
 * @returns String formatada DD/MM/AAAA
 */
export function formatDate(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 8);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
}

/**
 * Formata string para o padrão (99) 99999-9999 enquanto digita
 * @param value - String com números
 * @returns String formatada (99) 99999-9999
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export function formatRelativeDate(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();

  const intervals = [
    { label: "ano", seconds: 31536000 },
    { label: "mês", seconds: 2592000 },
    { label: "semana", seconds: 604800 },
    { label: "dia", seconds: 86400 },
    { label: "hora", seconds: 3600 },
    { label: "minuto", seconds: 60 },
  ];

  const plurals: Record<string, string> = {
    ano: "anos",
    mês: "meses",
    semana: "semanas",
    dia: "dias",
    hora: "horas",
    minuto: "minutos",
  };

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "agora";

  for (const { label, seconds: s } of intervals) {
    const value = Math.floor(seconds / s);
    if (value >= 1) {
      const unit = value > 1 ? plurals[label] : label;
      return `há ${value} ${unit}`;
    }
  }

  return "agora";
}
