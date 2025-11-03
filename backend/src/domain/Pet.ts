export type PetSpecies = 'Cachorro' | 'Cavalo' | 'Gato' | 'Outros';
export type PetSex = 'Macho' | 'Fêmea' | 'Irrelevante';

export interface Pet {
  id?: number;
  ownerId: number; // user id (Tutor)
  name: string; // 3..100
  species: PetSpecies; // obrigatório
  breed?: string | null; // 3..100 opcional
  sex?: PetSex | null;
  age?: number | null;
  weight?: number | null; // kg
  height?: number | null; // cm
  notes?: string | null; // adicional 3..100 opcional
  photoPath?: string | null;
  createdAt?: string;
}


