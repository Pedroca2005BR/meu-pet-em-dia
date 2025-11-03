import { Pet } from '../../domain/Pet';

export interface PetRepository {
  create(pet: Omit<Pet, 'id' | 'createdAt'>): Pet;
  update(id: number, data: Partial<Omit<Pet, 'id' | 'createdAt' | 'ownerId'>>): Pet;
  delete(id: number): void;
  findById(id: number): Pet | null;
  findAllByOwner(ownerId: number, filter?: { name?: string; species?: Pet['species'] }): Pet[];
}


