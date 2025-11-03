import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { SqliteUserRepository } from '../../infrastructure/repositories/SqliteUserRepository';
import { CreateUser } from '../../application/CreateUser';
import { UpdateUser } from '../../application/UpdateUser';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

export const adminRouter = Router();

// Middleware simples de autenticação do ator Administrador
adminRouter.use((req, res, next) => {
  const key = req.header('x-admin-key');
  const expected = process.env.ADMIN_KEY || 'changeme';
  if (!key || key !== expected) {
    console.warn(`[ADMIN AUTH] unauthorized - provided=${key ? 'yes' : 'no'} expectedSet=${!!expected}`);
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// Rota: criar usuário (RFS01)
adminRouter.post(
  '/users',
  upload.fields([
    { name: 'professionalIdDoc', maxCount: 1 },
    { name: 'diplomaDoc', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const repo = new SqliteUserRepository();
      const usecase = new CreateUser(repo);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      console.log('[ADMIN] Create user', { body: req.body, files: Object.keys(files || {}) });
      const created = usecase.execute({
        name: String(req.body.name || ''),
        cpf: String(req.body.cpf || ''),
        type: req.body.type === 'Veterinário' ? 'Veterinário' : 'Tutor',
        email: String(req.body.email || ''),
        phone: String(req.body.phone || ''),
        address: req.body.address ? String(req.body.address) : null,
        password: String(req.body.password || ''),
        crmv: req.body.crmv ? String(req.body.crmv) : null,
        clinicAddress: req.body.clinicAddress ? String(req.body.clinicAddress) : null,
        professionalIdDocPath: files?.professionalIdDoc?.[0]?.filename ? `/uploads/${files.professionalIdDoc[0].filename}` : null,
        diplomaDocPath: files?.diplomaDoc?.[0]?.filename ? `/uploads/${files.diplomaDoc[0].filename}` : null,
        role: req.body.role === 'admin' ? 'admin' : 'user',
      });
      // Remover hash da resposta
      const { passwordHash, ...safe } = created as any;
      return res.status(201).json(safe);
    } catch (e: any) {
      console.error('[ADMIN] Create user error:', e?.errors || e);
      if (e?.errors) return res.status(400).json({ message: 'ValidationError', errors: e.errors });
      return res.status(500).json({ message: 'InternalError' });
    }
  }
);

// Listar usuários com filtros (RFS04)
adminRouter.get('/users', (req, res) => {
  try {
    const repo = new SqliteUserRepository();
    const type = req.query.type === 'Veterinário' ? 'Veterinário' : (req.query.type === 'Tutor' ? 'Tutor' : undefined);
    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
    const users = repo.findAll({ type, q }).map((u) => {
      const { passwordHash, ...safe } = u as any;
      return safe;
    });
    res.json(users);
  } catch (e) {
    console.error('[ADMIN] List users error:', e);
    res.status(500).json({ message: 'InternalError' });
  }
});

// Obter usuário por id
adminRouter.get('/users/:id', (req, res) => {
  try {
    const repo = new SqliteUserRepository();
    const id = Number(req.params.id);
    const u = repo.findById(id);
    if (!u) return res.status(404).json({ message: 'NotFound' });
    const { passwordHash, ...safe } = u as any;
    res.json(safe);
  } catch (e) {
    console.error('[ADMIN] Get user error:', e);
    res.status(500).json({ message: 'InternalError' });
  }
});

// Atualizar usuário
adminRouter.put(
  '/users/:id',
  upload.fields([
    { name: 'professionalIdDoc', maxCount: 1 },
    { name: 'diplomaDoc', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const repo = new SqliteUserRepository();
      const usecase = new UpdateUser(repo);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const id = Number(req.params.id);
      console.log('[ADMIN] Update user', { id, body: req.body, files: Object.keys(files || {}) });
      const updated = usecase.execute({
        id,
        name: req.body.name,
        cpf: req.body.cpf,
        type: req.body.type,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: req.body.password,
        crmv: req.body.crmv,
        clinicAddress: req.body.clinicAddress,
        professionalIdDocPath: files?.professionalIdDoc?.[0]?.filename ? `/uploads/${files.professionalIdDoc[0].filename}` : undefined,
        diplomaDocPath: files?.diplomaDoc?.[0]?.filename ? `/uploads/${files.diplomaDoc[0].filename}` : undefined,
      } as any);
      const { passwordHash, ...safe } = updated as any;
      return res.json(safe);
    } catch (e: any) {
      console.error('[ADMIN] Update user error:', e?.errors || e);
      if (e?.message === 'NotFound') return res.status(404).json({ message: 'NotFound' });
      if (e?.errors) return res.status(400).json({ message: 'ValidationError', errors: e.errors });
      return res.status(500).json({ message: 'InternalError' });
    }
  }
);

// Excluir usuário
adminRouter.delete('/users/:id', (req, res) => {
  try {
    const repo = new SqliteUserRepository();
    const id = Number(req.params.id);
    const u = repo.findById(id);
    if (!u) return res.status(404).json({ message: 'NotFound' });
    // opcional: remover arquivos
    const maybeDelete = (p?: string | null) => {
      if (!p) return;
      const abs = path.resolve(process.cwd(), p.replace(/^\//, ''));
      fs.promises.unlink(abs).catch(() => void 0);
    };
    maybeDelete(u.professionalIdDocPath);
    maybeDelete(u.diplomaDocPath);
    repo.delete(id);
    res.status(204).send();
  } catch (e) {
    console.error('[ADMIN] Delete user error:', e);
    res.status(500).json({ message: 'InternalError' });
  }
});


