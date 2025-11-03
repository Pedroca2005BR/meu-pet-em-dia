import 'dotenv/config';
import { SqliteUserRepository } from '../infrastructure/repositories/SqliteUserRepository';
import { CreateUser } from '../application/CreateUser';

async function main() {
  const repo = new SqliteUserRepository();

  const email = 'admin@gmail.com';
  const existing = repo.findByEmail(email);
  if (existing) {
    console.log('[SEED] Admin já existe:', { id: existing.id, email: existing.email, role: existing.role });
    return;
  }

  const usecase = new CreateUser(repo);
  const created = usecase.execute({
    name: 'Administrador do Sistema',
    cpf: '123.456.789-09',
    type: 'Tutor',
    email,
    phone: '(11) 98765-4321',
    address: 'Av. Central, 1000 - São Paulo/SP',
    password: 'Modejudu@33',
    role: 'admin',
  });

  console.log('[SEED] Admin criado com sucesso:', { id: created.id, email: created.email, role: created.role });
}

main().catch((e) => {
  console.error('[SEED] Falha ao criar admin:', e);
  process.exit(1);
});


