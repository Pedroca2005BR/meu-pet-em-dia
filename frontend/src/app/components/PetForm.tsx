import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@lib/api';
import { Pet, PetSex, PetSpecies } from '../../types/Pet';

type FormState = {
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  age: string;
  weight: string;
  height: string;
  notes: string;
  photo: File | null;
};

export function PetForm({
  mode = 'create',
  initial,
  onSaved,
  onCancel,
}: {
  mode?: 'create' | 'edit';
  initial?: Pet | null;
  onSaved?: (p: Pet) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: '',
    species: 'Cachorro',
    breed: '',
    sex: 'Irrelevante',
    age: '',
    weight: '',
    height: '',
    notes: '',
    photo: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const canSubmit = useMemo(() => {
    const nameOk = form.name.trim().length >= 3 && form.name.trim().length <= 100;
    const breedOk = !form.breed || (form.breed.trim().length >= 3 && form.breed.trim().length <= 100);
    const notesOk = !form.notes || (form.notes.trim().length >= 3 && form.notes.trim().length <= 100);
    return nameOk && breedOk && notesOk;
  }, [form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrors({});
    setSuccessMsg('');
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('species', form.species);
      if (form.breed) fd.append('breed', form.breed.trim());
      if (form.sex) fd.append('sex', form.sex);
      if (form.age) fd.append('age', form.age);
      if (form.weight) fd.append('weight', form.weight);
      if (form.height) fd.append('height', form.height);
      if (form.notes) fd.append('notes', form.notes.trim());
      if (form.photo) fd.append('photo', form.photo);

      const url = mode === 'create' ? `${API_BASE_URL}/pets` : `${API_BASE_URL}/pets/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const token = localStorage.getItem('token');
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const ok = mode === 'create' ? res.status === 201 : res.ok;
      const data = await res.json().catch(() => ({}));
      if (ok) {
        setSuccessMsg(mode === 'create' ? 'Pet cadastrado com sucesso' : 'Pet atualizado com sucesso');
        onSaved?.(data as Pet);
        if (mode === 'create') {
          setForm({ name: '', species: 'Cachorro', breed: '', sex: 'Irrelevante', age: '', weight: '', height: '', notes: '', photo: null });
        }
        return;
      }
      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.message ?? 'Falha ao salvar pet' });
    } catch (err) {
      setErrors({ general: 'Erro de rede' });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name,
        species: initial.species,
        breed: initial.breed ?? '',
        sex: initial.sex ?? 'Irrelevante',
        age: initial.age != null ? String(initial.age) : '',
        weight: initial.weight != null ? String(initial.weight) : '',
        height: initial.height != null ? String(initial.height) : '',
        notes: initial.notes ?? '',
        photo: null,
      });
    }
  }, [mode, initial]);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errors.general && (
        <div style={{ padding: '12px 16px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: 'var(--text-sm)' }}>
          {errors.general}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(107, 207, 127, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: 'var(--text-sm)' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div>
          <label>Nome *</label>
          <input data-testid="pet-name" value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Nome do pet" required />
          {errors.name && <small style={{ color: 'var(--error)' }}>{errors.name}</small>}
        </div>
        <div>
          <label>Espécie *</label>
          <select data-testid="pet-species" value={form.species} onChange={(e) => onChange('species', e.target.value as PetSpecies)}>
            <option>Cachorro</option>
            <option>Cavalo</option>
            <option>Gato</option>
            <option>Outros</option>
          </select>
          {errors.species && <small style={{ color: 'var(--error)' }}>{errors.species}</small>}
        </div>
        <div>
          <label>Raça</label>
          <input value={form.breed} onChange={(e) => onChange('breed', e.target.value)} placeholder="Raça" />
          {errors.breed && <small style={{ color: 'var(--error)' }}>{errors.breed}</small>}
        </div>
        <div>
          <label>Sexo</label>
          <select value={form.sex} onChange={(e) => onChange('sex', e.target.value as PetSex)}>
            <option>Irrelevante</option>
            <option>Macho</option>
            <option>Fêmea</option>
          </select>
        </div>
        <div>
          <label>Idade</label>
          <input type="number" min={0} value={form.age} onChange={(e) => onChange('age', e.target.value)} placeholder="Anos" />
        </div>
        <div>
          <label>Peso (kg)</label>
          <input type="number" min={0} step="0.01" value={form.weight} onChange={(e) => onChange('weight', e.target.value)} placeholder="Ex: 12.5" />
        </div>
        <div>
          <label>Altura (cm)</label>
          <input type="number" min={0} step="0.1" value={form.height} onChange={(e) => onChange('height', e.target.value)} placeholder="Ex: 35" />
        </div>
        <div>
          <label>Adicional</label>
          <input value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações" />
          {errors.notes && <small style={{ color: 'var(--error)' }}>{errors.notes}</small>}
        </div>
        <div>
          <label>Foto</label>
          <input type="file" accept="image/*" onChange={(e) => onChange('photo', e.target.files?.[0] ?? null)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 8, flexWrap: 'wrap' }}>
        <button data-testid="pet-submit" type="submit" disabled={!canSubmit || submitting} style={{ flex: 1, minWidth: 200 }}>
          {submitting ? 'Enviando...' : (mode === 'create' ? '✓ Cadastrar Pet' : '✓ Salvar Alterações')}
        </button>
        <button type="button" className="secondary" onClick={onCancel} style={{ flex: 1, minWidth: 200 }}>
          ✕ Cancelar
        </button>
      </div>
    </form>
  );
}


