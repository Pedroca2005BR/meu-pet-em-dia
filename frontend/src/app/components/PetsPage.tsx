import { useState } from 'react';
import { Pet } from '../../types/Pet';
import { PetList } from './PetList';
import { PetModal } from './PetModal';

export function PetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-md)' }}>🐾</div>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}>Meus Pets</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Cadastre, edite e gerencie seus pets</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px' }}>
            <span style={{ fontSize: 20 }}>➕</span>
            Cadastrar Pet
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <PetList key={refreshKey} onEdit={(p) => { setEditing(p); setModalOpen(true); }} onRefresh={() => setRefreshKey((k) => k + 1)} />
        </div>
      </div>

      <PetModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} mode={editing ? 'edit' : 'create'} initial={editing ?? undefined} onSaved={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}


