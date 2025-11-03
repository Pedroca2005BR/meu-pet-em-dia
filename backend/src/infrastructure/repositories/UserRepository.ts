import { User } from '../../domain/User';

export interface UserRepository {
  create(user: Omit<User, 'id' | 'createdAt'>): User;
  findByCPF(cpf: string): User | null;
  findById(id: number): User | null;
  findAll(filter?: { type?: User['type']; q?: string }): User[];
  update(id: number, user: Partial<Omit<User, 'id' | 'createdAt'>>): User;
  delete(id: number): void;
  findByEmail(email: string): User | null;
}


