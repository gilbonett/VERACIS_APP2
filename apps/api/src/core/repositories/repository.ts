import { Transaction } from "./transaction";

/**
 * Abstract base class that defines the
 * standard contract for domain entity repositories.
 *
 * @template E The entity type used as input
 * for repository operations (`Entity`).
 * @template R The return type for read operations (`Result`). Defaults to `E`.
 *
 * This class provides a standard CRUD structure and should be extended
 * by specific repositories for each domain aggregate.
 *
 * @example
 * ```ts
 * export abstract class AccountRepository extends BaseRepository<Account> {
 *   abstract findByEmail(email: string): Promise<Account | null>
 * }
 * ```
 */
export abstract class Repository<E> {
  /**
   * Persists a new entity in the data source.
   *
   * @param entity The entity instance to be created.
   * @returns A Promise that resolves when the operation is complete.
   */
  abstract create(entity: E, tx?: Transaction): Promise<void>;

  /**
   * Finds an entity by its unique identifier.
   *
   * @param id The unique identifier of the entity.
   * @returns A Promise that resolves with the
   * entity found or `null` if not found.
   */
  abstract findById(id: string): Promise<E | null>;

  /**
   * Retrieves all entities from the data source.
   *
   * @returns A Promise that resolves with an array of entities.
   */
  abstract findAll(): Promise<E[]>;

  /**
   * Updates an existing entity in the data source.
   *
   * @param entity The entity instance with updated data.
   * @returns A Promise that resolves when the operation is complete.
   */
  abstract save(entity: E): Promise<void>;

  /**
   * Deletes an entity by its unique identifier.
   *
   * @param id The unique identifier of the entity to delete.
   * @returns A Promise that resolves when the operation is complete.
   */
  abstract delete(entity: E): Promise<void>;
}
