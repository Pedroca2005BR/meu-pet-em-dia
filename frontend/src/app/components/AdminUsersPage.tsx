import { useState } from 'react';
import { AdminUserList } from './AdminUserList';
import { UserModal } from './UserModal';
import { User } from '../../types/User';

export function AdminUsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditing(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      padding: '32px 16px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: 'var(--shadow-md)',
            }}>
              🧑‍💼
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-3xl)',
                margin: 0,
                marginBottom: '4px',
                color: 'var(--text-primary)',
              }}>
                Gerenciar Usuários
              </h1>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-base)',
                margin: 0,
              }}>
                Cadastre, edite e gerencie os usuários do sistema
              </p>
            </div>
          </div>

          <button
            data-testid="btn-open-admin-user-modal"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
            }}
          >
            <span style={{ fontSize: '20px' }}>➕</span>
            Cadastrar Usuário
          </button>
        </div>

        {/* List Section */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border)',
        }}>
          <AdminUserList 
            key={refreshKey}
            onEdit={handleOpenEdit}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      {/* Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        mode={editing ? 'edit' : 'create'}
        initial={editing ?? undefined}
        onSaved={handleSaved}
      />
    </div>
  );
}


