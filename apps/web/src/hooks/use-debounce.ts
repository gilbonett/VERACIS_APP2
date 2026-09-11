import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook para debounce de funções
 * @param callback - Função a ser executada com debounce
 * @param delay - Tempo de delay em milissegundos
 * @returns Função com debounce aplicado
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Mantém a referência do callback atualizada
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Limpa o timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay],
  )
}
