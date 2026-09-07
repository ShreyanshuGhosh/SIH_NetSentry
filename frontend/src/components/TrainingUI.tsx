// src/components/TrainingUI.tsx
// AI Training GUI (Human-in-the-Loop) Rebuilt for Zero Slop (§6.1, §6.2, §6.8)
// 3-Part Architecture: Review Queue -> Raw CLI & Extensible Mapping Form -> Few-Shot Store

import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle,
  XCircle,
  ArrowRight,
  Database,
  Plus,
  MagnifyingGlass,
  Check,
  CaretRight,
  Archive,
  LockSimple,
  Sparkle,
  CircleNotch,
} from '@phosphor-icons/react';
import { exemplarStore } from '../engine/exemplarStore';
import { api, AskAIResult } from '../services/api';
import {
  BaselineFieldDefinition,
  FewShotExemplar,
  SupportedVendor,
  TrainingQueueItem,
  VENDOR_DISPLAY_NAMES,
} from '../types/canonical';
import { ConfidenceGateSlider } from './training/ConfidenceGateSlider';
import { MonoCodeBlock } from './shared/MonoCodeBlock';

interface TrainingUIProps {
  onTrainingUpdated?: () => void;
}

export const TrainingUI: React.FC<TrainingUIProps> = ({ onTrainingUpdated }) => {
  const [confidenceGate, setConfidenceGate] = useState<number>(0.80);
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [fieldSearch, setFieldSearch] = useState<string>('');

  // Local state pulled from exemplarStore
  const [queue, setQueue] = useState<TrainingQueueItem[]>(() => exemplarStore.getQueue(0.99));
  const [exemplars, setExemplars] = useState<FewShotExemplar[]>(() => exemplarStore.getExemplars());
  const [baselineFields, setBaselineFields] = useState<BaselineFieldDefinition[]>(() =>
    exemplarStore.getBaselineFields()
  );

  const [selectedItem, setSelectedItem] = useState<TrainingQueueItem | null>(() => {
    const p = exemplarStore.getQueue(0.99);
    return p.length > 0 ? p[0] : null;
  });

  const [selectedFieldKey, setSelectedFieldKey] = useState<string>(
    selectedItem?.suggestedField || 'sessionIdleTimeoutMinutes'
  );
  const [mappedValue, setMappedValue] = useState<string>('10');
  const [toast, setToast] = useState<{ type: 'success' | 'reject'; message: string } | null>(null);
  const [bottomTab, setBottomTab] = useState<'exemplars' | 'rejected'>('exemplars');

  // Opt-In AI Assist State (§4.B)
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AskAIResult | null>(null);

  // §6.1 New field creation state
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'boolean' | 'number' | 'string'>('boolean');

  // Sync state with FastAPI backend on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [q, ex, f] = await Promise.all([
          api.getTrainingQueue(),
          api.getExemplars(),
          api.getBaselineFields(),
        ]);
        if (q && q.length > 0) {
          const mappedQueue: TrainingQueueItem[] = q.map((item) => ({
            id: item.id,
            deviceId: item.device_id,
            vendor: item.vendor as any,
            rawCommandBlock: item.raw_command_block,
            lineNumbers: item.line_numbers,
            suggestedField: item.suggested_field,
            suggestedValue: item.suggested_value,
            confidence: item.confidence,
            status: item.status as any,
            timestamp: item.timestamp,
          }));
          setQueue(mappedQueue);
          if (!selectedItem && mappedQueue.length > 0) {
            setSelectedItem(mappedQueue[0]);
          }
        }
        if (ex && ex.length > 0) {
          setExemplars(
            ex.map((e) => ({
              id: e.id,
              vendor: e.vendor as any,
              rawLinePattern: e.raw_line_pattern,
              mappedFieldKey: e.mapped_field_key,
              mappedValue: e.mapped_value,
              approvedBy: e.approved_by,
              approvedAt: e.approved_at,
              timesReused: e.times_reused,
            }))
          );
        }
        if (f && f.length > 0) {
          setBaselineFields(
            f.map((field) => ({
              key: field.key,
              label: field.label,
              framework: field.frameworks as any,
              valueType: field.value_type as any,
              createdBy: field.created_by as any,
              createdAt: new Date().toISOString(),
              description: field.label,
            }))
          );
        }
      } catch (err) {
        console.warn('Backend connection fallback in TrainingUI:', err);
      }
    }
    loadBackendData();
  }, []);

  // Filtered queue items based on confidence gate and vendor
  const pendingItems = queue.filter((q) => {
    if (q.status !== 'pending') return false;
    if (q.confidence >= confidenceGate) return false;
    if (vendorFilter !== 'all' && q.vendor !== vendorFilter) return false;
    return true;
  });

  // Filtered baseline fields
  const filteredFields = baselineFields.filter(
    (f) =>
      f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.key.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  const showToast = (type: 'success' | 'reject', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectQueueItem = (item: TrainingQueueItem) => {
    setSelectedItem(item);
    setAiSuggestion(null);
    if (item.suggestedField) {
      setSelectedFieldKey(item.suggestedField);
    }
    if (item.suggestedValue !== undefined) {
      setMappedValue(String(item.suggestedValue));
    }
  };

  // Opt-In AI Assist Handler (Calls POST /api/training/ask-ai)
  const handleAskAi = async () => {
    if (!selectedItem) return;
    setIsAiLoading(true);
    try {
      const res = await api.askAI(selectedItem.rawCommandBlock, selectedItem.vendor);
      setAiSuggestion(res);
      if (res.suggested_field) {
        setSelectedFieldKey(res.suggested_field);
      }
      if (res.suggested_value !== undefined && res.suggested_value !== null) {
        setMappedValue(String(res.suggested_value));
      }
      showToast('success', `Gemini suggested: ${res.suggested_field} (${Math.round(res.confidence * 100)}% confidence)`);
    } catch (err: any) {
      showToast('reject', err.message || 'Gemini inference failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  // §6.2 Approve and save exemplar (Backend API + Local Store)
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    let parsedVal: any = mappedValue;
    if (mappedValue === 'true') parsedVal = true;
    else if (mappedValue === 'false') parsedVal = false;
    else if (!isNaN(Number(mappedValue)) && mappedValue.trim() !== '') parsedVal = Number(mappedValue);

    try {
      await api.approveTrainingItem({
        queue_id: selectedItem.id,
        mapped_field_key: selectedFieldKey,
        mapped_value: parsedVal,
        approved_by: 'SecOps Admin (Opt-In Gemini Assisted)',
      });
      const [q, ex] = await Promise.all([api.getTrainingQueue(), api.getExemplars()]);
      setQueue(
        q.map((item) => ({
          id: item.id,
          deviceId: item.device_id,
          vendor: item.vendor as any,
          rawCommandBlock: item.raw_command_block,
          lineNumbers: item.line_numbers,
          suggestedField: item.suggested_field,
          suggestedValue: item.suggested_value,
          confidence: item.confidence,
          status: item.status as any,
          timestamp: item.timestamp,
        }))
      );
      setExemplars(
        ex.map((e) => ({
          id: e.id,
          vendor: e.vendor as any,
          rawLinePattern: e.raw_line_pattern,
          mappedFieldKey: e.mapped_field_key,
          mappedValue: e.mapped_value,
          approvedBy: e.approved_by,
          approvedAt: e.approved_at,
          timesReused: e.times_reused,
        }))
      );
      setAiSuggestion(null);
      showToast('success', `Saved exemplar for ${selectedFieldKey}. Generalized to future audits.`);

      const nextPending = q.find((it) => it.id !== selectedItem.id && it.status === 'pending');
      if (nextPending) {
        setSelectedItem({
          id: nextPending.id,
          deviceId: nextPending.device_id,
          vendor: nextPending.vendor as any,
          rawCommandBlock: nextPending.raw_command_block,
          lineNumbers: nextPending.line_numbers,
          suggestedField: nextPending.suggested_field,
          suggestedValue: nextPending.suggested_value,
          confidence: nextPending.confidence,
          status: nextPending.status as any,
          timestamp: nextPending.timestamp,
        });
      } else {
        setSelectedItem(null);
      }
      onTrainingUpdated?.();
    } catch (err: any) {
      showToast('reject', err.message || 'Failed to save exemplar');
    }
  };

  // §6.8 Reject item flow (retained in audit log)
  const handleReject = async () => {
    if (!selectedItem) return;
    try {
      await api.rejectTrainingItem(selectedItem.id, 'Spurious syntax block');
      const q = await api.getTrainingQueue();
      setQueue(
        q.map((item) => ({
          id: item.id,
          deviceId: item.device_id,
          vendor: item.vendor as any,
          rawCommandBlock: item.raw_command_block,
          lineNumbers: item.line_numbers,
          suggestedField: item.suggested_field,
          suggestedValue: item.suggested_value,
          confidence: item.confidence,
          status: item.status as any,
          timestamp: item.timestamp,
        }))
      );
      setAiSuggestion(null);
      showToast('reject', 'Marked item as non-compliance-relevant. Retained in rejection audit log.');
      const nextPending = q.find((it) => it.id !== selectedItem.id && it.status === 'pending');
      setSelectedItem(nextPending ? (nextPending as any) : null);
      onTrainingUpdated?.();
    } catch (err: any) {
      showToast('reject', err.message || 'Failed to reject queue item');
    }
  };

  // §6.1 Register new baseline field
  const handleCreateNewField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldKey.trim() || !newFieldLabel.trim()) return;
    try {
      const created = await api.registerBaselineField({
        key: newFieldKey.trim().replace(/\s+/g, '_'),
        label: newFieldLabel.trim(),
        frameworks: ['cis_v8'],
        value_type: newFieldType,
      });
      const f = await api.getBaselineFields();
      setBaselineFields(
        f.map((field) => ({
          key: field.key,
          label: field.label,
          framework: field.frameworks as any,
          valueType: field.value_type as any,
          createdBy: field.created_by as any,
          createdAt: new Date().toISOString(),
          description: field.label,
        }))
      );
      setSelectedFieldKey(created.key);
      setIsCreatingField(false);
      setNewFieldKey('');
      setNewFieldLabel('');
      showToast('success', `Registered new baseline field: ${created.label}`);
    } catch (err: any) {
      showToast('reject', err.message || 'Failed to register baseline field');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Brain size={22} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Human-in-the-Loop AI Training GUI
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Review low-confidence syntax extracted by the Amber Lane. When you map an unrecognized command,
            it saves to the Few-Shot Store and immediately generalizes across other devices without redeployment.
          </p>
        </div>

        {/* Store Counter Header */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            className="p-3 rounded-lg border text-right"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="text-[10px] font-mono uppercase text-slate-500">Exemplar Catalog</div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular">{exemplars.length}</div>
          </div>
          <div
            className="p-3 rounded-lg border text-right"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="text-[10px] font-mono uppercase text-slate-500">Pending Review</div>
            <div className="text-xl font-bold font-mono text-amber-600 tabular">{pendingItems.length}</div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className="p-3 rounded border text-xs flex items-center gap-2 animate-fade-in"
          style={{
            backgroundColor: toast.type === 'success' ? 'var(--status-pass-bg)' : 'var(--bg-surface-raised)',
            borderColor: toast.type === 'success' ? 'rgba(46, 204, 113, 0.3)' : 'var(--border-subtle)',
            color: toast.type === 'success' ? 'var(--status-pass)' : 'var(--text-secondary)',
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={16} weight="fill" /> : <Archive size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Part 1: Review Queue & Confidence Slider (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <ConfidenceGateSlider
            confidenceThreshold={confidenceGate}
            onChangeThreshold={setConfidenceGate}
            pendingCount={pendingItems.length}
          />

          <div
            className="rounded-lg border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between font-mono text-[11px] text-slate-500"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span>AMBER LANE QUEUE</span>
              <span>{pendingItems.length} ITEMS</span>
            </div>

            {/* Vendor Filter Tabs */}
            <div className="p-2 border-b flex gap-1 overflow-x-auto text-[10px] font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
              {['all', 'cisco_ios', 'juniper_junos', 'sonic', 'arista_eos', 'fortinet_fortios'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVendorFilter(v)}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    vendorFilter === v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v === 'all' ? 'All' : v.split('_')[0].toUpperCase()}
                </button>
              ))}
            </div>

            {/* Queue Item List */}
            <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
              {pendingItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  No items in review queue below {(confidenceGate * 100).toFixed(0)}% confidence.
                </div>
              ) : (
                pendingItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const vendorInfo = VENDOR_DISPLAY_NAMES[item.vendor];

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectQueueItem(item)}
                      className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected ? 'bg-slate-100 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border text-slate-700 border-slate-300 bg-slate-100">
                            {vendorInfo?.dialect || item.vendor}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{item.lineNumbers}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-800 truncate mt-1">
                          {item.rawCommandBlock}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-[10px] font-bold text-amber-600">
                          {Math.round(item.confidence * 100)}%
                        </div>
                        <div className="text-[9px] text-slate-500">Amber</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Part 2: Raw CLI Block & Extensible Mapping Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedItem ? (
            <div
              className="p-6 rounded-lg border space-y-6"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              {/* Target Item Header */}
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                    <span>Unrecognized Command Block</span>
                    <span className="font-mono text-[10px] text-amber-700 px-2 py-0.5 rounded border border-amber-200 bg-amber-50">
                      Confidence: {Math.round(selectedItem.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Device: {selectedItem.deviceId} • Vendor: {selectedItem.vendor}
                  </div>
                </div>

                {/* Reject Action (§6.8) */}
                <button
                  onClick={handleReject}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Mark as not compliance-relevant"
                >
                  <XCircle size={14} />
                  <span>Reject / Not Relevant</span>
                </button>
              </div>

              {/* Raw CLI Syntax Display */}
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase mb-2">
                  Captured Raw Command Block
                </div>
                <MonoCodeBlock
                  code={selectedItem.rawCommandBlock}
                  language={selectedItem.vendor}
                  maxHeight="160px"
                  showLineNumbers={false}
                />
              </div>

              {/* Opt-In AI Assist Bar (§4.B) */}
              <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Sparkle size={15} className="text-indigo-600" weight="fill" />
                    <span>Opt-In AI Assist (Gemini 3.1 Flash-Lite)</span>
                  </div>
                  <div className="text-[11px] text-indigo-800/80 mt-0.5">
                    Trigger on-demand inference to inspect raw syntax and auto-suggest the baseline mapping.
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={handleAskAi}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-xs ${
                    isAiLoading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
                  }`}
                >
                  {isAiLoading ? (
                    <>
                      <CircleNotch size={14} className="animate-spin" />
                      <span>Analyzing with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkle size={14} weight="bold" />
                      <span>✨ Auto-Map with Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Suggestion Card if available */}
              {aiSuggestion && (
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs space-y-1.5 animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkle size={14} className="text-emerald-600" weight="fill" />
                      <span>Gemini Recommendation ({Math.round(aiSuggestion.confidence * 100)}% Confidence)</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                      AI SUGGESTED
                    </span>
                  </div>
                  <div className="text-emerald-950 font-medium">
                    Mapped to: <strong className="font-mono text-emerald-800">{aiSuggestion.suggested_field}</strong> = <strong className="font-mono text-emerald-800">{String(aiSuggestion.suggested_value)}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-800 italic leading-snug">
                    "{aiSuggestion.reasoning}"
                  </div>
                </div>
              )}

              {/* Mapping Form */}
              <form onSubmit={handleApprove} className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">
                    Map to Baseline Schema Field
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingField(!isCreatingField)}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>{isCreatingField ? 'Cancel' : 'Register New Field'}</span>
                  </button>
                </div>

                {/* §6.1 On-the-fly field registration modal/card */}
                {isCreatingField && (
                  <div className="p-4 rounded border bg-slate-50 border-sky-300 space-y-3">
                    <div className="text-xs font-semibold text-sky-900">
                      Create Extensible Baseline Field (§6.1)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-1">Field Key (camelCase)</label>
                        <input
                          type="text"
                          placeholder="e.g. bgpAuthEnabled"
                          value={newFieldKey}
                          onChange={(e) => setNewFieldKey(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded text-xs font-mono text-slate-900 bg-white border border-slate-300 outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-1">Human Label</label>
                        <input
                          type="text"
                          placeholder="e.g. BGP Peer Authentication"
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded text-xs text-slate-900 bg-white border border-slate-300 outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-1">Data Type</label>
                        <select
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded text-xs text-slate-900 bg-white border border-slate-300 outline-none focus:border-sky-500"
                        >
                          <option value="boolean">Boolean</option>
                          <option value="number">Number</option>
                          <option value="string">String</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNewField}
                      className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 cursor-pointer"
                    >
                      Save New Field to Schema
                    </button>
                  </div>
                )}

                {/* Field Search & Picker */}
                <div className="space-y-2">
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search baseline controls..."
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded text-xs text-slate-900 bg-white border border-slate-300 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 border rounded border-slate-200 bg-slate-50">
                    {filteredFields.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setSelectedFieldKey(f.key)}
                        className={`text-left p-2 rounded text-xs transition-colors cursor-pointer border ${
                          selectedFieldKey === f.key
                            ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 truncate">{f.label}</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">{f.key}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Normalized Value Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Normalized Parameter Value
                  </label>
                  <input
                    type="text"
                    value={mappedValue}
                    onChange={(e) => setMappedValue(e.target.value)}
                    placeholder="e.g. true, false, 10, or value"
                    className="w-full px-3 py-2 rounded text-xs font-mono text-slate-900 bg-white border border-slate-300 outline-none focus:border-sky-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    Enter <span className="font-mono text-slate-700 font-semibold">true</span>, <span className="font-mono text-slate-700 font-semibold">false</span>, a numeric limit, or text string.
                  </div>
                </div>

                {/* Approve Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-md hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Save to Few-Shot Store & Generalize</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div
              className="p-12 rounded-lg border text-center text-slate-500"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              Select an item from the Amber Lane queue to inspect raw syntax and map it to the baseline schema.
            </div>
          )}

          {/* Part 3: Few-Shot Exemplar Store & Rejection Audit Log (§6.2, §6.8, Test 2 & Test 4) */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBottomTab('exemplars')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    bottomTab === 'exemplars'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Database size={14} />
                  <span>Exemplar Store ({exemplars.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBottomTab('rejected')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    bottomTab === 'rejected'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Archive size={14} />
                  <span>Rejection Audit Log ({exemplarStore.getRejectedAuditLog().length})</span>
                </button>
              </div>
              <span className="font-mono text-[10px] text-slate-500 font-medium">
                {bottomTab === 'exemplars' ? 'Persistent across sessions & devices' : 'Retained per §6.8 / Test 4 audit rule'}
              </span>
            </div>

            {bottomTab === 'exemplars' ? (
              <div className="divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
                {exemplars.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 italic">No approved exemplars yet.</div>
                ) : (
                  exemplars.map((ex) => (
                    <div key={ex.id} className="p-3.5 text-xs flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border text-slate-700 border-slate-300 bg-slate-100">
                            {ex.vendor}
                          </span>
                          <span className="font-semibold text-slate-900">{ex.mappedFieldKey}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                            = {String(ex.mappedValue)}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 truncate">
                          Pattern: "{ex.rawLinePattern}"
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border inline-block"
                          style={{
                            backgroundColor: ex.timesReused > 0 ? 'rgba(46, 204, 113, 0.1)' : 'var(--bg-surface-raised)',
                            borderColor: ex.timesReused > 0 ? 'rgba(46, 204, 113, 0.3)' : 'var(--border-subtle)',
                            color: ex.timesReused > 0 ? 'var(--status-pass)' : 'var(--text-disabled)',
                          }}
                        >
                          {ex.timesReused}x Reused
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ex.approvedAt}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
                {exemplarStore.getRejectedAuditLog().length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 italic">No rejected items in audit log.</div>
                ) : (
                  exemplarStore.getRejectedAuditLog().map((rej) => (
                    <div key={rej.id} className="p-3.5 text-xs flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border text-slate-700 border-slate-300 bg-slate-100">
                            {rej.vendor}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{rej.deviceId}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-semibold">
                            STATUS: REJECTED
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-700 truncate">
                          Command: {rej.rawCommandBlock}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Audit Trail: Excluded from active review queue; preserved to verify system avoids training on non-compliance noise.
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] text-slate-400">{rej.lineNumbers}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
