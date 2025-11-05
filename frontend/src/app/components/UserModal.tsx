import { useEffect, useRef } from 'react';
import { AdminUserForm } from './AdminUserForm';
import { User } from '../../types/User';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: User;
  onSaved: () => void;
}

export function UserModal({ isOpen, onClose, mode, initial, onSaved }: UserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-testid="admin-user-modal"
        ref={modalRef}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--surface)',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              {mode === 'create' ? '➕' : '✏️'}
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-2xl)',
                margin: 0,
                color: 'var(--text-primary)',
              }}>
                {mode === 'create' ? 'Cadastrar Novo Usuário' : 'Editar Usuário'}
              </h2>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                {mode === 'create' ? 'Preencha os dados para criar um novo usuário' : 'Altere as informações necessárias'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s ease',
              lineHeight: 1,
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--background)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          <AdminUserForm
            mode={mode}
            initial={initial}
            onSaved={() => {
              onSaved();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

