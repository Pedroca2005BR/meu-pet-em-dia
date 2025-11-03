import { db } from '../db';
import { Pet } from '../../domain/Pet';
import { PetRepository } from './PetRepository';

export class SqlitePetRepository implements PetRepository {
  create(pet: Omit<Pet, 'id' | 'createdAt'>): Pet {
    const info = db.prepare(`
      INSERT INTO pets (ownerId, name, species, breed, sex, age, weight, height, notes, photoPath)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pet.ownerId,
      pet.name,
      pet.species,
      pet.breed ?? null,
      pet.sex ?? null,
      pet.age ?? null,
      pet.weight ?? null,
      pet.height ?? null,
      pet.notes ?? null,
      pet.photoPath ?? null,
    );
    const row = db.prepare('SELECT * FROM pets WHERE id = ?').get(info.lastInsertRowid as number) as Pet;
    return row;
  }

  update(id: number, data: Partial<Omit<Pet, 'id' | 'createdAt' | 'ownerId'>>): Pet {
    const current = this.findById(id);
    if (!current) throw new Error('NotFound');
    const next: Pet = { ...current, ...data };
    db.prepare(`
      UPDATE pets SET
        name = ?, species = ?, breed = ?, sex = ?, age = ?, weight = ?, height = ?, notes = ?, photoPath = ?
      WHERE id = ?
    `).run(
      next.name,
      next.species,
      next.breed ?? null,
      next.sex ?? null,
      next.age ?? null,
      next.weight ?? null,
      next.height ?? null,
      next.notes ?? null,
      next.photoPath ?? null,
      id,
    );
    return this.findById(id)!;
  }

  delete(id: number): void {
    db.prepare('DELETE FROM pets WHERE id = ?').run(id);
  }

  findById(id: number): Pet | null {
    const row = db.prepare('SELECT * FROM pets WHERE id = ?').get(id) as Pet | undefined;
    return row ?? null;
  }

  findAllByOwner(ownerId: number, filter?: { name?: string; species?: Pet['species'] }): Pet[] {
    const clauses: string[] = ['ownerId = ?'];
    const params: unknown[] = [ownerId];
    if (filter?.name) {
      clauses.push('name LIKE ?');
      params.push(`%${filter.name}%`);
    }
    if (filter?.species) {
      clauses.push('species = ?');
      params.push(filter.species);
    }
    const where = `WHERE ${clauses.join(' AND ')}`;
    const sql = `SELECT * FROM pets ${where} ORDER BY datetime(createdAt) DESC, id DESC`;
    return db.prepare(sql).all(...params) as Pet[];
  }
}


