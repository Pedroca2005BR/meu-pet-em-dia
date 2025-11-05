import { useEffect, useMemo, useState } from 'react';
import { ADMIN_KEY, API_BASE_URL } from '@lib/api';
import { maskBrPhone, isCompleteBrPhone } from '../../utils/brPhone';
import { User } from '../../types/User';

type UserType = 'Tutor' | 'Veterinário';

type CreateUserPayload = {
  name: string;
  cpf: string;
  type: UserType;
  email: string;
  phone: string;
  address?: string;
  password: string;
  crmv?: string;
  clinicAddress?: string;
  professionalIdDoc?: File | null;
  diplomaDoc?: File | null;
};

export function AdminUserForm({
  mode = 'create',
  initial,
  onSaved,
  onCancel,
}: {
  mode?: 'create' | 'edit';
  initial?: User | null;
  onSaved?: (u: User) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<CreateUserPayload>({
    name: '',
    cpf: '',
    type: 'Tutor',
    email: '',
    phone: '',
    address: '',
    password: '',
    crmv: '',
    clinicAddress: '',
    professionalIdDoc: null,
    diplomaDoc: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isVet = form.type === 'Veterinário';
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  function onChange<K extends keyof CreateUserPayload>(key: K, value: CreateUserPayload[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const canSubmit = useMemo(() => {
    // validações mínimas no front (backend fará validação completa)
    const passwordValid = mode === 'edit' 
      ? (form.password === '' || (form.password.length >= 8 && form.password.length <= 12))
      : (form.password.length >= 8 && form.password.length <= 12);
    
    const requiredBase = form.name.trim().length >= 3 && form.name.trim().length <= 100 &&
      form.cpf.trim().length > 0 &&
      form.email.trim().length >= 10 && form.email.trim().length <= 256 &&
      isCompleteBrPhone(form.phone) &&
      passwordValid;
    
    if (!requiredBase) return false;
    
    if (isVet) {
      // No modo de edição, os arquivos são opcionais (pode manter os existentes)
      if (mode === 'edit') {
        return Boolean(form.crmv && form.clinicAddress);
      }
      return Boolean(form.crmv && form.clinicAddress && form.professionalIdDoc && form.diplomaDoc);
    }
    return true;
  }, [form, isVet, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSuccessMsg('');
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('cpf', form.cpf.trim());
      fd.append('type', form.type);
      fd.append('email', form.email.trim());
      fd.append('phone', form.phone.trim());
      if (form.address) fd.append('address', form.address);
      if (mode === 'create' || form.password) fd.append('password', form.password);
      if (isVet) {
        fd.append('crmv', form.crmv?.trim() ?? '');
        fd.append('clinicAddress', form.clinicAddress?.trim() ?? '');
        if (form.professionalIdDoc) fd.append('professionalIdDoc', form.professionalIdDoc);
        if (form.diplomaDoc) fd.append('diplomaDoc', form.diplomaDoc);
      }

      const url = mode === 'create' ? `${API_BASE_URL}/admin/users` : `${API_BASE_URL}/admin/users/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'x-admin-key': ADMIN_KEY }, body: fd });
      const ok = mode === 'create' ? res.status === 201 : res.ok;
      const data = await res.json().catch(() => ({}));
      if (ok) {
        if (mode === 'create') {
          setSuccessMsg('Usuário criado com sucesso');
          setForm({
            name: '', cpf: '', type: 'Tutor', email: '', phone: '', address: '', password: '',
            crmv: '', clinicAddress: '', professionalIdDoc: null, diplomaDoc: null,
          });
        } else {
          setSuccessMsg('Usuário atualizado com sucesso');
        }
        onSaved?.(data as User);
        return;
      }
      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.message ?? 'Falha ao salvar usuário' });
    } catch (err) {
      setErrors({ general: 'Erro de rede' });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => { setErrors({}); }, [form.type]);

  // carregar dados iniciais para edição
  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name,
        cpf: initial.cpf,
        type: initial.type,
        email: initial.email,
        phone: initial.phone,
        address: initial.address ?? '',
        password: '',
        crmv: initial.crmv ?? '',
        clinicAddress: initial.clinicAddress ?? '',
        professionalIdDoc: null,
        diplomaDoc: null,
      });
    }
  }, [mode, initial]);

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errors.general && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error)',
          fontSize: 'var(--text-sm)',
        }}>
          {errors.general}
        </div>
      )}
      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(107, 207, 127, 0.1)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success)',
          fontSize: 'var(--text-sm)',
        }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div>
          <label>Nome *</label>
          <input data-testid="admin-user-name" value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Nome completo" required />
          {errors.name && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.name}</small>}
        </div>

        <div>
          <label>CPF *</label>
          <input data-testid="admin-user-cpf" value={form.cpf} onChange={(e) => onChange('cpf', e.target.value)} placeholder="000.000.000-00" required />
          {errors.cpf && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.cpf}</small>}
        </div>
      </div>

      <div>
        <label>Tipo de Usuário *</label>
        <select value={form.type} onChange={(e) => onChange('type', e.target.value as UserType)}>
          <option>Tutor</option>
          <option>Veterinário</option>
        </select>
        {errors.type && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.type}</small>}
      </div>

      {isVet && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label>CRMV *</label>
              <input value={form.crmv} onChange={(e) => onChange('crmv', e.target.value)} placeholder="CRMV-UF 12345" required />
              {errors.crmv && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.crmv}</small>}
            </div>

            <div>
              <label>Endereço da Clínica *</label>
              <input value={form.clinicAddress} onChange={(e) => onChange('clinicAddress', e.target.value)} placeholder="Rua, CEP e cidade" required />
              {errors.clinicAddress && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.clinicAddress}</small>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label>Documento de identidade profissional (CRMV) *</label>
              <input type="file" onChange={(e) => onChange('professionalIdDoc', e.target.files?.[0] ?? null)} required={mode === 'create'} />
              {errors.professionalIdDoc && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.professionalIdDoc}</small>}
            </div>

            <div>
              <label>Diploma/Certificado *</label>
              <input type="file" onChange={(e) => onChange('diplomaDoc', e.target.files?.[0] ?? null)} required={mode === 'create'} />
              {errors.diplomaDoc && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.diplomaDoc}</small>}
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div>
          <label>E-mail *</label>
          <input data-testid="admin-user-email" type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="email@dominio.com" required />
          {errors.email && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.email}</small>}
        </div>

        <div>
          <label>Celular *</label>
          <input data-testid="admin-user-phone" value={form.phone} onChange={(e) => onChange('phone', maskBrPhone(e.target.value))} placeholder="(00) 00000-0000" required />
          {errors.phone && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.phone}</small>}
        </div>
      </div>

      {!isVet && (
        <div>
          <label>Endereço</label>
          <input data-testid="admin-user-address" value={form.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Rua, CEP e cidade" />
          {errors.address && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.address}</small>}
        </div>
      )}

      <div>
        <label>Senha {mode === 'edit' && '(deixe em branco para manter a atual)'}</label>
        <input data-testid="admin-user-password" type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} placeholder="8 a 12 caracteres" required={mode === 'create'} />
        {errors.password && <small style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{errors.password}</small>}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
        <button 
          data-testid="admin-user-submit"
          type="submit" 
          disabled={!canSubmit || submitting}
          style={{ flex: 1, minWidth: '200px' }}
        >
          {submitting ? 'Enviando...' : (mode === 'create' ? '✓ Cadastrar Usuário' : '✓ Salvar Alterações')}
        </button>
        {mode === 'create' ? (
          <button type="button" className="secondary" onClick={() => window.location.reload()} style={{ flex: 1, minWidth: '200px' }}>
            🔄 Limpar Formulário
          </button>
        ) : (
          <button type="button" className="secondary" onClick={onCancel} style={{ flex: 1, minWidth: '200px' }}>
            ✕ Cancelar Edição
          </button>
        )}
      </div>
    </form>
  );
}


