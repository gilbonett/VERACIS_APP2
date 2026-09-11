export function formatCode(raw = ''): string {
  // Remove tudo que não é número e limita a 6 dígitos
  const digits = raw.replace(/\D/g, '').slice(0, 6)

  // Se tiver 3 ou menos dígitos, retorna sem formatação
  if (digits.length <= 3) return digits

  // Se tiver mais de 3, adiciona o hífen: 000-000
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}
