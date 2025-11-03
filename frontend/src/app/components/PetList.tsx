import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@lib/api';
import { Pet, PetSpecies } from '../../types/Pet';

export function PetList({ onEdit, onRefresh }: { onEdit: (p: Pet) => void; onRefresh: () => void }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'Todos' | PetSpecies>('Todos');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (name.trim()) params.set('name', name.trim());
      if (species !== 'Todos') params.set('species', species);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/pets?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPets(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro ao carregar pets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id: number) {
    if (!confirm('Deseja remover este pet? Esta ação não pode ser desfeita.')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/pets/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 204) { load(); onRefresh(); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>⏳ Carregando...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: 32, color: 'var(--error)' }}>{error}</div>;

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 200, flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Filtrar por nome" style={{ width: '100%' }} />
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Espécie</label>
          <select value={species} onChange={(e) => setSpecies(e.target.value as any)}>
            <option>Todos</option>
            <option>Cachorro</option>
            <option>Cavalo</option>
            <option>Gato</option>
            <option>Outros</option>
          </select>
        </div>
        <button onClick={load} style={{ minWidth: 140 }}>🔍 Buscar</button>
      </div>

      {/* Lista */}
      {!pets.length ? (
        <div style={{ textAlign: 'center', padding: 48, border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--background)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum pet encontrado</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--surface)' }}>
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: 16 }}>Foto</th>
                <th style={{ textAlign: 'left', padding: 16 }}>Nome</th>
                <th style={{ textAlign: 'left', padding: 16 }}>Espécie</th>
                <th style={{ textAlign: 'left', padding: 16 }}>Raça</th>
                <th style={{ textAlign: 'left', padding: 16 }}>Sexo</th>
                <th style={{ textAlign: 'left', padding: 16 }}>Idade</th>
                <th style={{ textAlign: 'center', padding: 16 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--surface)' : 'var(--background)' }}>
                  <td style={{ padding: 12 }}>
                    {p.photoPath ? (
                      <img src={p.photoPath} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>🐶</div>
                    )}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 12 }}>{p.species}</td>
                  <td style={{ padding: 12 }}>{p.breed || '-'}</td>
                  <td style={{ padding: 12 }}>{p.sex || '-'}</td>
                  <td style={{ padding: 12 }}>{p.age != null ? `${p.age} ano(s)` : '-'}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={() => onEdit(p)} style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>✏️ Editar</button>
                      <button className="danger" onClick={() => onDelete(p.id)} style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>🗑️ Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


