import React, { useState } from 'react';
import { Database, CheckCircle, ArrowRight } from '@phosphor-icons/react';
import { FewShotExemplar, SecurityBaselineModel, TrainingItem } from '../types/audit';
import { INITIAL_FEW_SHOT_EXEMPLARS, INITIAL_TRAINING_QUEUE } from '../data/fewShotStore';

interface TrainingUIProps {
  onTrainingUpdated?: () => void;
}

const BASELINE_OPTIONS: { key: keyof SecurityBaselineModel; label: string; defaultVal: string }[] = [
  { key: 'session_idle_timeout_minutes', label: 'Session Idle Timeout (min)', defaultVal: '10' },
  { key: 'telnet_disabled',              label: 'Disable Telnet Daemon',      defaultVal: 'true' },
  { key: 'ssh_version',                  label: 'SSH Protocol Version',       defaultVal: '2' },
  { key: 'remote_syslog_enabled',        label: 'Remote Centralized Syslog',  defaultVal: 'true' },
  { key: 'insecure_http_server_disabled',label: 'Disable HTTP Web Server',    defaultVal: 'true' },
  { key: 'snmp_version',                 label: 'SNMP Level (v3 only)',       defaultVal: 'v3' },
  { key: 'login_banner_present',         label: 'Authorized Login Banner',    defaultVal: 'true' },
  { key: 'aaa_authentication_enabled',   label: 'Centralized AAA Auth',       defaultVal: 'true' },
];

export const TrainingUI: React.FC<TrainingUIProps> = ({ onTrainingUpdated }) => {
  const [queue, setQueue]         = useState<TrainingItem[]>(INITIAL_TRAINING_QUEUE);
  const [exemplars, setExemplars] = useState<FewShotExemplar[]>(INITIAL_FEW_SHOT_EXEMPLARS);
  const [selected, setSelected]   = useState<TrainingItem | null>(queue[0] ?? null);
  const [field, setField]         = useState<keyof SecurityBaselineModel>('session_idle_timeout_minutes');
  const [value, setValue]         = useState('10');
  const [note, setNote]           = useState('');
  const [toast, setToast]         = useState<string | null>(null);

  const handleFieldSelect = (k: keyof SecurityBaselineModel) => {
    setField(k);
    setValue(BASELINE_OPTIONS.find(o => o.key === k)?.defaultVal ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const parsed = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
    const exemplar: FewShotExemplar = {
      id: `fse-${Date.now()}`,
      vendor: selected.vendor,
      rawSyntax: selected.rawCommandBlock,
      mappedField: field,
      mappedValue: parsed,
      contributor: 'SecOps Admin (NTRO Active Learning)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = queue.map(i => i.id === selected.id ? { ...i, status: 'mapped' as const, confidence: 0.98 } : i);
    setExemplars(prev => [exemplar, ...prev]);
    setQueue(updated);
    setToast(`Mapped to ${field}`);
    setTimeout(() => setToast(null), 3000);
    setSelected(updated.find(i => i.status === 'pending') ?? null);
    onTrainingUpdated?.();
  };

  const pending = queue.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Human-in-the-Loop Training
          </h2>
          <p className="text-sm max-w-[52ch]" style={{ color: 'var(--text-secondary)' }}>
            Map low-confidence CLI lines to baseline schema fields. Each approved label is saved to the few-shot store and improves future LLM extractions.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Exemplar Store
          </div>
          <div className="text-3xl font-bold tabular" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {exemplars.length}
          </div>
          <div className="font-mono text-[11px]" style={{ color: pending > 0 ? 'var(--warn)' : 'var(--text-tertiary)' }}>
            {pending} pending review
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="mb-8 flex items-center gap-3 text-sm pl-4 py-2"
          style={{ borderLeft: '2px solid var(--pass)', color: 'var(--pass)' }}
        >
          <CheckCircle size={14} weight="fill" />
          {toast} - few-shot store updated
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12">

        {/* Queue list */}
        <aside className="lg:col-span-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] py-3" style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
            Review Queue ({queue.length})
          </p>
          {queue.map(item => (
            <button
              key={item.id}
              onClick={() => item.status === 'pending' && setSelected(item)}
              className="w-full text-left py-3.5 flex items-start gap-3 transition-colors cursor-pointer"
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                opacity: item.status === 'mapped' ? 0.35 : 1,
                cursor: item.status === 'mapped' ? 'default' : 'pointer',
              }}
            >
              <div className="mt-1 shrink-0">
                {item.status === 'mapped'
                  ? <CheckCircle size={13} weight="fill" style={{ color: 'var(--pass)' }} />
                  : <div className="w-3 h-3 rounded-full border" style={{ borderColor: 'var(--warn)' }} />
                }
              </div>
              <div className="min-w-0">
                <div
                  className="font-mono text-xs truncate"
                  style={{ color: selected?.id === item.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {item.rawCommandBlock}
                </div>
                <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {item.vendor} - {(item.confidence * 100).toFixed(0)}% conf
                </div>
              </div>
            </button>
          ))}
        </aside>

        {/* Mapping form */}
        <div className="lg:col-span-8 mt-8 lg:mt-0">
          {selected ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Unrecognized CLI Block
                </p>
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                  <pre className="font-mono text-sm p-5 leading-relaxed whitespace-pre-wrap break-all" style={{ color: 'var(--warn)' }}>
                    {selected.rawCommandBlock}
                  </pre>
                </div>
                <div className="flex gap-6 mt-2 font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  <span>Vendor: {selected.vendor}</span>
                  <span>Confidence: {(selected.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Map to Baseline Field
                </p>
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {BASELINE_OPTIONS.map(opt => (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => handleFieldSelect(opt.key)}
                      className="w-full text-left py-3 flex items-center justify-between cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--border-subtle)', color: field === opt.key ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    >
                      <span className="text-sm">{opt.label}</span>
                      {field === opt.key && (
                        <span className="font-mono text-[10px]" style={{ color: 'var(--accent)' }}>{opt.key}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mapped Value', val: value, setter: setValue, mono: true, placeholder: '' },
                  { label: 'Admin Note (optional)', val: note, setter: setNote, mono: false, placeholder: 'Context for this mapping...' },
                ].map(({ label, val, setter, mono, placeholder }) => (
                  <div key={label}>
                    <label className="block font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={e => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-lg px-4 py-2.5 text-sm transition-colors"
                      style={{
                        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer active:scale-95 transition-opacity"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Save to Few-Shot Store
                <ArrowRight size={14} weight="bold" />
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle size={32} weight="duotone" style={{ color: 'var(--pass)', marginBottom: 16 }} />
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Queue cleared</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>All pending CLI blocks have been labeled.</p>
            </div>
          )}
        </div>

        {/* Exemplar log */}
        <div className="lg:col-span-12 mt-10" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}>
          <div className="flex items-center gap-2 mb-4">
            <Database size={13} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Few-Shot Exemplar Store</span>
            <span className="font-mono text-[11px] ml-1" style={{ color: 'var(--text-tertiary)' }}>({exemplars.length} records)</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {exemplars.slice(0, 8).map(ex => (
              <div
                key={ex.id}
                className="flex items-center gap-6 py-3 font-mono text-xs"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span className="shrink-0 w-36 truncate" style={{ color: 'var(--text-tertiary)' }}>{ex.timestamp}</span>
                <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{ex.rawSyntax}</span>
                <span className="shrink-0" style={{ color: 'var(--accent)' }}>{ex.mappedField}</span>
                <span className="shrink-0" style={{ color: 'var(--text-mono)' }}>{String(ex.mappedValue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
