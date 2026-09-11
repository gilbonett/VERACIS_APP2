/**
 * Marcador opaco de transação. Domínio conhece só isso — zero dependência
 * de Prisma. Infra recebe esse tipo e faz cast interno pro client real
 * (`tx as Prisma.TransactionClient`), já que só ela sabe a forma concreta.
 */
export type Transaction = unknown;
