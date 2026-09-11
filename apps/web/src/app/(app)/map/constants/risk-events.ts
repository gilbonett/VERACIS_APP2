export const RISK_ICON_BASE = '/categories/risc'

export const RISK_OUTRO_ICON_ID = '5005'

export type RiskSituationEntry = {
  icon: string
  label: string
}

export const RISK_SITUATIONS: readonly RiskSituationEntry[] = [
  { icon: '5000', label: 'Desaparecidos' },
  { icon: '5001', label: 'Desabrigados' },
  { icon: '5002', label: 'Desalojado' },
  { icon: '5003', label: 'Feridos' },
  { icon: '5004', label: 'Risco à vida' },
  { icon: '5005', label: 'Outro' },
] as const

export const RISK_ICON_TO_API_RISK_NAME: Readonly<Record<string, string>> = {
  '5000': 'Desaparecidos',
  '5001': 'Desabrigados',
  '5002': 'Desalojado',
  '5003': 'Feridos',
  '5004': 'Risco à vida',
  '5005': 'Outro (risco)',
}

export const RISK_SITUATION_HELP_BY_ICON: Readonly<Record<string, string>> = {
  '5004':
    'Quando há perigo imediato para a vida das pessoas, condições que possam causar morte ou ferimentos graves.',
  '5001':
    'Quando pessoas perderam suas casas, precisando de abrigo temporário, como escolas, igrejas ou casas de familiares.',
  '5002':
    'Quando pessoas precisaram sair de suas casas temporariamente, e podem retornar quando a situação for resolvida.',
  '5003':
    'Indica que há pessoas com ferimentos ou que precisaram de atendimento por causa da situação registrada no alerta.',
  '5000':
    'Quando uma ou mais pessoas estão desaparecidas ou não foram localizadas após o evento ocorrido na comunidade.',
}
