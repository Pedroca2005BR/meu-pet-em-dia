import { useEffect, useState } from 'react';
import { ADMIN_KEY, API_BASE_URL } from '@lib/api';
import { User } from '../../types/User';

export function AdminUserList({ onEdit, onRefresh }: { onEdit: (u: User) => void; onRefresh: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [type, setType] = useState<'Todos' | 'Tutor' | 'Veterinário'>('Todos');
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (type !== 'Todos') params.set('type', type);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, { headers: { 'x-admin-key': ADMIN_KEY } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é permanente e removerá todos os dados associados (ex.: pets, agendamentos, histórico, registros financeiros).')) return;
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE', headers: { 'x-admin-key': ADMIN_KEY } });
    if (res.status === 204) {
      load();
      onRefresh();
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px',
        background: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--error)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header com Título e Refresh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 'var(--text-2xl)',
          margin: 0,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span>📋</span>
          Lista de Usuários
        </h2>
        <button
          onClick={() => {
            load();
            onRefresh();
          }}
          className="secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🔄</span>
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
            Tipo de Usuário
          </label>
          <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ width: '100%' }}>
            <option>Todos</option>
            <option>Tutor</option>
            <option>Veterinário</option>
          </select>
        </div>

        <div style={{ flex: 2, minWidth: '280px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
            Buscar por Nome ou CPF
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Digite o nome ou CPF..."
            style={{ width: '100%' }}
          />
        </div>

        <button onClick={load} style={{ minWidth: '140px' }}>
          🔍 Buscar
        </button>
      </div>

      {/* Tabela */}
      {!users.length ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'var(--background)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
            Nenhum usuário encontrado
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'var(--surface)',
          }}>
            <thead>
              <tr style={{
                background: 'var(--background)',
                borderBottom: '2px solid var(--border)',
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '16px',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}>Nome</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}>CPF</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}>Tipo</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}>Email</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}>Celular</th>
                <th style={{
                  textAlign: 'center',
                  padding: '16px',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: idx % 2 === 0 ? 'var(--surface)' : 'var(--background)',
                  transition: 'background 0.2s ease',
                }}>
                  <td style={{ padding: '16px', fontSize: 'var(--text-sm)' }}>{u.name}</td>
                  <td style={{ padding: '16px', fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}>{u.cpf}</td>
                  <td style={{ padding: '16px', fontSize: 'var(--text-sm)' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: u.type === 'Veterinário' ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 107, 157, 0.1)',
                      color: u.type === 'Veterinário' ? 'var(--secondary-dark)' : 'var(--primary-dark)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-medium)',
                    }}>
                      {u.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 'var(--text-sm)' }}>{u.email}</td>
                  <td style={{ padding: '16px', fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}>{u.phone}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        data-testid={`admin-edit-${u.id}`}
                        onClick={() => onEdit(u)}
                        style={{
                          padding: '8px 16px',
                          fontSize: 'var(--text-xs)',
                          minWidth: 'auto',
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        data-testid={`admin-delete-${u.id}`}
                        className="danger"
                        onClick={() => onDelete(u.id)}
                        style={{
                          padding: '8px 16px',
                          fontSize: 'var(--text-xs)',
                          minWidth: 'auto',
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--background)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        Total: <strong style={{ color: 'var(--text-primary)' }}>{users.length}</strong> usuário{users.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}


