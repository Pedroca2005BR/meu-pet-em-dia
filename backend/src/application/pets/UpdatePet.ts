import { Pet, PetSpecies, PetSex } from '../../domain/Pet';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type UpdatePetInput = {
  id: number;
  data: Partial<{
    name: string;
    species: PetSpecies;
    breed: string | null;
    sex: PetSex | null;
    age: number | null;
    weight: number | null;
    height: number | null;
    notes: string | null;
    photoPath: string | null;
  }>;
};

export class UpdatePet {
  constructor(private readonly repo: PetRepository) {}

  execute(input: UpdatePetInput): Pet {
    const existing = this.repo.findById(input.id);
    if (!existing) throw new Error('NotFound');

    const errors: Record<string, string> = {};
    const next: any = {};

    if (input.data.name !== undefined) {
      const name = (input.data.name || '').trim();
      if (name.length < 3 || name.length > 100) errors.name = 'Nome deve ter entre 3 e 100 caracteres';
      else next.name = name;
    }
    if (input.data.species !== undefined) {
      if (!['Cachorro','Cavalo','Gato','Outros'].includes(input.data.species as any)) errors.species = 'Espécie inválida';
      else next.species = input.data.species;
    }
    if (input.data.breed !== undefined) {
      const b = (input.data.breed || '').trim();
      if (b && (b.length < 3 || b.length > 100)) errors.breed = 'Raça deve ter entre 3 e 100 caracteres';
      else next.breed = b || null;
    }
    if (input.data.notes !== undefined) {
      const n = (input.data.notes || '').trim();
      if (n && (n.length < 3 || n.length > 100)) errors.notes = 'Adicional deve ter entre 3 e 100 caracteres';
      else next.notes = n || null;
    }
    if (input.data.sex !== undefined) next.sex = input.data.sex;
    if (input.data.age !== undefined) next.age = input.data.age;
    if (input.data.weight !== undefined) next.weight = input.data.weight;
    if (input.data.height !== undefined) next.height = input.data.height;
    if (input.data.photoPath !== undefined) next.photoPath = input.data.photoPath;

    if (Object.keys(errors).length) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }

    return this.repo.update(existing.id!, next);
  }
}


