import { UserTerms } from "../entities/user-terms";

export abstract class UserTermsRepository {
  abstract create(terms: UserTerms): Promise<void>;
}
