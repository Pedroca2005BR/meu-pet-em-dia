import { User, UserRole, UserType } from '../domain/User';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { isValidCPF, isValidEmail, isValidName, isValidPassword, isValidPhoneBr } from './validators';
import { hashPassword } from './password';

export type UpdateUserInput = {
  id: number;
  name?: string;
  cpf?: string;
  type?: UserType;
  email?: string;
  phone?: string;
  address?: string | null;
  password?: string; // opcional: se fornecida, será trocada
  crmv?: string | null;
  clinicAddress?: string | null;
  professionalIdDocPath?: string | null; // se null explícito, limpa
  diplomaDocPath?: string | null; // se null explícito, limpa
  role?: UserRole;
};

export class UpdateUser {
  constructor(private readonly repo: UserRepository) {}

  execute(input: UpdateUserInput): User {
    const existing = this.repo.findById(input.id);
    if (!existing) throw new Error('NotFound');

    const next: Partial<User> = {};
    const errors: Record<string, string> = {};

    if (input.name !== undefined) {
      if (!isValidName(input.name)) errors.name = 'Nome deve ter entre 3 e 100 caracteres';
      else next.name = input.name.trim();
    }
    if (input.cpf !== undefined) {
      if (!isValidCPF(input.cpf)) errors.cpf = 'CPF inválido (use 000.000.000-00)';
      else {
        const normalized = normalizeCPF(input.cpf);
        const duplicate = this.repo.findByCPF(normalized);
        if (duplicate && duplicate.id !== existing.id) errors.cpf = 'CPF já cadastrado';
        else next.cpf = normalized;
      }
    }
    if (input.type !== undefined) {
      if (!['Tutor', 'Veterinário'].includes(input.type)) errors.type = 'Tipo inválido';
      else next.type = input.type;
    }
    if (input.email !== undefined) {
      if (!isValidEmail(input.email)) errors.email = 'E-mail inválido (10 a 256 caracteres)';
      else next.email = input.email.trim();
    }
    if (input.phone !== undefined) {
      if (!isValidPhoneBr(input.phone)) errors.phone = 'Celular inválido (formato: (00) 00000-0000)';
      else next.phone = input.phone.trim();
    }
    if (input.address !== undefined) next.address = input.address?.trim() || null;

    if (input.password !== undefined) {
      if (!isValidPassword(input.password)) errors.password = 'Senha inválida (8-12, com número, especial e maiúscula)';
      else next.passwordHash = hashPassword(input.password);
    }

    if (input.role !== undefined) {
      if (!['admin', 'user'].includes(input.role)) errors.role = 'Role inválida';
      else next.role = input.role;
    }

    // Campos específicos do Veterinário
    const targetType = (next.type ?? existing.type);
    if (targetType === 'Veterinário') {
      if (input.crmv !== undefined) next.crmv = input.crmv?.trim() || null;
      if (input.clinicAddress !== undefined) next.clinicAddress = input.clinicAddress?.trim() || null;
      if (input.professionalIdDocPath !== undefined) next.professionalIdDocPath = input.professionalIdDocPath;
      if (input.diplomaDocPath !== undefined) next.diplomaDocPath = input.diplomaDocPath;
      // Garantir obrigatórios se vier mudança que os impacte
      const final = { ...existing, ...next } as User;
      if (!final.crmv) errors.crmv = 'CRMV é obrigatório';
      if (!final.professionalIdDocPath) errors.professionalIdDoc = 'Documento profissional é obrigatório';
      if (!final.diplomaDocPath) errors.diplomaDoc = 'Diploma/Certificado é obrigatório';
    } else {
      // Tutor: limpa campos de Vet se vier mudança de tipo
      if (next.type === 'Tutor') {
        next.crmv = null;
        next.clinicAddress = null;
        next.professionalIdDocPath = null;
        next.diplomaDocPath = null;
      }
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }

    return this.repo.update(input.id, next);
  }
}

function normalizeCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}

// hash imported


