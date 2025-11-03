import { Pet, PetSpecies, PetSex } from '../../domain/Pet';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type CreatePetInput = {
  ownerId: number;
  name: string;
  species: PetSpecies;
  breed?: string | null;
  sex?: PetSex | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  notes?: string | null;
  photoPath?: string | null;
};

export class CreatePet {
  constructor(private readonly repo: PetRepository) {}

  execute(input: CreatePetInput): Pet {
    const errors: Record<string, string> = {};

    const name = (input.name || '').trim();
    if (name.length < 3 || name.length > 100) errors.name = 'Nome deve ter entre 3 e 100 caracteres';

    if (!['Cachorro','Cavalo','Gato','Outros'].includes(input.species)) errors.species = 'Espécie inválida';

    if (input.breed) {
      const b = input.breed.trim();
      if (b && (b.length < 3 || b.length > 100)) errors.breed = 'Raça deve ter entre 3 e 100 caracteres';
    }

    if (input.notes) {
      const n = input.notes.trim();
      if (n && (n.length < 3 || n.length > 100)) errors.notes = 'Adicional deve ter entre 3 e 100 caracteres';
    }

    if (Object.keys(errors).length) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }

    return this.repo.create({
      ownerId: input.ownerId,
      name,
      species: input.species,
      breed: input.breed?.trim() || null,
      sex: input.sex ?? null,
      age: input.age ?? null,
      weight: input.weight ?? null,
      height: input.height ?? null,
      notes: input.notes?.trim() || null,
      photoPath: input.photoPath ?? null,
    });
  }
}


