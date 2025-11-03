import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { requireAuth } from '../middleware/auth';
import { SqlitePetRepository } from '../../infrastructure/repositories/SqlitePetRepository';
import { CreatePet } from '../../application/pets/CreatePet';
import { UpdatePet } from '../../application/pets/UpdatePet';
import { DeletePet } from '../../application/pets/DeletePet';
import { ListPets } from '../../application/pets/ListPets';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `pet-${unique}${ext}`);
  },
});
const upload = multer({ storage });

export const petsRouter = Router();

// Todas as rotas exigem autenticação
petsRouter.use(requireAuth);

// Listar pets do tutor (RFS08)
petsRouter.get('/', (req: any, res) => {
  if (req.user.type !== 'Tutor') return res.status(403).json({ message: 'Apenas tutor pode acessar pets' });
  try {
    const repo = new SqlitePetRepository();
    const list = new ListPets(repo);
    const name = typeof req.query.name === 'string' ? req.query.name : undefined;
    const species = typeof req.query.species === 'string' ? req.query.species : undefined;
    const pets = list.execute(req.user.id, { name, species: species as any });
    res.json(pets);
  } catch (e) {
    console.error('[PETS] list error', e);
    res.status(500).json({ message: 'InternalError' });
  }
});

// Criar pet (RFS05)
petsRouter.post('/', upload.single('photo'), (req: any, res) => {
  if (req.user.type !== 'Tutor') return res.status(403).json({ message: 'Apenas tutor pode cadastrar pets' });
  try {
    const repo = new SqlitePetRepository();
    const create = new CreatePet(repo);
    const created = create.execute({
      ownerId: req.user.id,
      name: String(req.body.name || ''),
      species: (req.body.species || '') as any,
      breed: req.body.breed ? String(req.body.breed) : null,
      sex: req.body.sex ? String(req.body.sex) as any : null,
      age: req.body.age ? Number(req.body.age) : null,
      weight: req.body.weight ? Number(req.body.weight) : null,
      height: req.body.height ? Number(req.body.height) : null,
      notes: req.body.notes ? String(req.body.notes) : null,
      photoPath: req.file ? `/uploads/${req.file.filename}` : null,
    });
    res.status(201).json(created);
  } catch (e: any) {
    console.error('[PETS] create error', e?.errors || e);
    if (e?.errors) return res.status(400).json({ message: 'ValidationError', errors: e.errors });
    res.status(500).json({ message: 'InternalError' });
  }
});

// Atualizar pet (RFS06)
petsRouter.put('/:id', upload.single('photo'), (req: any, res) => {
  if (req.user.type !== 'Tutor') return res.status(403).json({ message: 'Apenas tutor pode alterar pets' });
  try {
    const id = Number(req.params.id);
    const repo = new SqlitePetRepository();
    const existing = repo.findById(id);
    if (!existing || existing.ownerId !== req.user.id) return res.status(404).json({ message: 'NotFound' });

    const update = new UpdatePet(repo);
    const updated = update.execute({
      id,
      data: {
        name: req.body.name,
        species: req.body.species,
        breed: req.body.breed ?? undefined,
        sex: req.body.sex ?? undefined,
        age: req.body.age ? Number(req.body.age) : undefined,
        weight: req.body.weight ? Number(req.body.weight) : undefined,
        height: req.body.height ? Number(req.body.height) : undefined,
        notes: req.body.notes ?? undefined,
        photoPath: req.file ? `/uploads/${req.file.filename}` : undefined,
      },
    });
    res.json(updated);
  } catch (e: any) {
    console.error('[PETS] update error', e?.errors || e);
    if (e?.errors) return res.status(400).json({ message: 'ValidationError', errors: e.errors });
    res.status(500).json({ message: 'InternalError' });
  }
});

// Deletar pet (RFS07)
petsRouter.delete('/:id', (req: any, res) => {
  if (req.user.type !== 'Tutor') return res.status(403).json({ message: 'Apenas tutor pode deletar pets' });
  try {
    const id = Number(req.params.id);
    const repo = new SqlitePetRepository();
    const existing = repo.findById(id);
    if (!existing || existing.ownerId !== req.user.id) return res.status(404).json({ message: 'NotFound' });
    const del = new DeletePet(repo);
    del.execute(id);
    res.status(204).send();
  } catch (e) {
    console.error('[PETS] delete error', e);
    res.status(500).json({ message: 'InternalError' });
  }
});


