import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SqliteUserRepository } from '../../infrastructure/repositories/SqliteUserRepository';

export function requireAuth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const auth = req.header('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as any;
    const repo = new SqliteUserRepository();
    const u = repo.findById(Number(payload.id));
    if (!u) return res.status(401).json({ message: 'Unauthorized' });
    req.user = { id: u.id, role: u.role, type: u.type };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}


