import { Pet } from '../../domain/Pet';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export class ListPets {
  constructor(private readonly repo: PetRepository) {}

  execute(ownerId: number, filter?: { name?: string; species?: Pet['species'] }): Pet[] {
    return this.repo.findAllByOwner(ownerId, {
      name: filter?.name?.trim() || undefined,
      species: filter?.species || undefined,
    });
  }
}


