import { cn } from '@/lib/utils'

export const MAP_ALERT_SEARCH_INPUT_CLASS =
  'rounded-[27px] border-0 bg-[rgba(248,248,248,0.64)] shadow-none focus-within:border-0 focus-within:ring-0 focus-within:outline-none'

export const STRUCTURAL_MAP_ALERT_SEARCH_INPUT_CLASS =
  'rounded-[27px] border-0 bg-[rgba(248,248,248,0.64)] shadow-none focus-within:border-0 focus-within:ring-0 focus-within:outline-none'

export const STRUCTURAL_ALERT_SEARCH_FIELD_CLASS =
  'h-[54px] w-full max-w-[481px]'

export function mapAlertSearchInputControlClassName(): string {
  return cn(
    'h-full w-full min-h-0 rounded-[27px] border-0 bg-transparent py-0 pl-[21px] pr-4 align-middle outline-none',
    'text-base font-normal leading-[100%] tracking-normal text-[#333333]',
    'placeholder:text-[12px] placeholder:font-semibold placeholder:leading-[100%] placeholder:tracking-normal placeholder:text-[#9F9C9B] placeholder:[font-family:Rawline]',
  )
}
