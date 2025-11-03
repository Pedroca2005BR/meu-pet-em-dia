export type PetSpecies = 'Cachorro' | 'Cavalo' | 'Gato' | 'Outros';
export type PetSex = 'Macho' | 'Fêmea' | 'Irrelevante';

export interface Pet {
  id: number;
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
  createdAt?: string;
}


