import { db } from '../db';
import { User } from '../../domain/User';
import { UserRepository } from './UserRepository';

export class SqliteUserRepository implements UserRepository {
  create(user: Omit<User, 'id' | 'createdAt'>): User {
    const stmt = db.prepare(`
      INSERT INTO users (
        name, cpf, type, email, phone, address, passwordHash, role,
        crmv, clinicAddress, professionalIdDocPath, diplomaDocPath
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      user.name,
      user.cpf,
      user.type,
      user.email,
      user.phone,
      user.address ?? null,
      user.passwordHash,
      user.role,
      user.crmv ?? null,
      user.clinicAddress ?? null,
      user.professionalIdDocPath ?? null,
      user.diplomaDocPath ?? null,
    );
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid as number) as User;
    return row;
  }

  findByCPF(cpf: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE cpf = ?').get(cpf) as User | undefined;
    return row ?? null;
  }

  findById(id: number): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return row ?? null;
  }

  findByEmail(email: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    return row ?? null;
  }

  findAll(filter?: { type?: User['type']; q?: string }): User[] {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter?.type) {
      clauses.push('type = ?');
      params.push(filter.type);
    }
    if (filter?.q) {
      clauses.push('(name LIKE ? OR cpf LIKE ?)');
      const like = `%${filter.q}%`;
      params.push(like, like);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    // Ordenação padrão: alfabética por nome (case-insensitive)
    const sql = `SELECT * FROM users ${where} ORDER BY name COLLATE NOCASE ASC`;
    return db.prepare(sql).all(...params) as User[];
  }

  update(id: number, user: Partial<Omit<User, 'id' | 'createdAt'>>): User {
    const current = this.findById(id);
    if (!current) throw new Error('NotFound');
    const updated: User = { ...current, ...user };
    db.prepare(`
      UPDATE users SET
        name = ?, cpf = ?, type = ?, email = ?, phone = ?, address = ?,
        passwordHash = ?, role = ?, crmv = ?, clinicAddress = ?,
        professionalIdDocPath = ?, diplomaDocPath = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.cpf,
      updated.type,
      updated.email,
      updated.phone,
      updated.address ?? null,
      updated.passwordHash,
      updated.role,
      updated.crmv ?? null,
      updated.clinicAddress ?? null,
      updated.professionalIdDocPath ?? null,
      updated.diplomaDocPath ?? null,
      id,
    );
    return this.findById(id)!;
  }

  delete(id: number): void {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
}


