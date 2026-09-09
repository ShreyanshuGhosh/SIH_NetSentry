// src/components/TrainingUI.tsx
// AI Training GUI (Human-in-the-Loop) — Clean, User-Friendly Browser History Prototype
// 100% client-side localStorage persistence with Reset/Clear Previous Data functionality (§6.1, §6.2, §6.8)

import React, { useState } from 'react';
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
  Trash,
  ArrowCounterClockwise,
  Sparkle,
  X,
  FileCode,
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

  // 100% Client-Side State pulled from exemplarStore (browser history localStorage)
  const [queue, setQueue] = useState<TrainingQueueItem[]>(() => exemplarStore.getAllQueueItems());
  const [exemplars, setExemplars] = useState<FewShotExemplar[]>(() => exemplarStore.getExemplars());
  const [baselineFields, setBaselineFields] = useState<BaselineFieldDefinition[]>(() =>
    exemplarStore.getBaselineFields()
  );

  const pendingItems = queue.filter((q) => q.status === 'pending' && q.confidence < confidenceGate && (vendorFilter === 'all' || q.vendor === vendorFilter));

  const [selectedItem, setSelectedItem] = useState<TrainingQueueItem | null>(() => {
    return pendingItems.length > 0 ? pendingItems[0] : (queue.find(q => q.status === 'pending') || null);
  });

  const [selectedFieldKey, setSelectedFieldKey] = useState<string>(
    selectedItem?.suggestedField || 'sessionIdleTimeoutMinutes'
  );
  const [mappedValue, setMappedValue] = useState<string>('10');
  const [toast, setToast] = useState<{ type: 'success' | 'reject'; message: string } | null>(null);
  const [bottomTab, setBottomTab] = useState<'exemplars' | 'rejected'>('exemplars');

  // Opt-In AI Assist State
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AskAIResult | null>(null);

  // New Field Creation Modal State
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'boolean' | 'number' | 'string'>('boolean');

  const showToast = (type: 'success' | 'reject', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const syncLocalState = () => {
    const q = exemplarStore.getAllQueueItems();
    const ex = exemplarStore.getExemplars();
    const f = exemplarStore.getBaselineFields();
    setQueue(q);
    setExemplars(ex);
    setBaselineFields(f);
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

  // Opt-In AI Assist Handler
  const handleAskAi = async () => {
    if (!selectedItem) return;
    setIsAiLoading(true);
    try {
      const res = await api.askAI(selectedItem.rawCommandBlock, selectedItem.vendor);
      setAiSuggestion(res);
      if (res.suggested_field && res.suggested_field !== 'null' && res.suggested_field !== 'None') {
        setSelectedFieldKey(res.suggested_field);
      }
      if (res.suggested_value !== undefined && res.suggested_value !== null) {
        setMappedValue(String(res.suggested_value));
      }
      showToast('success', `AI Analyzed: Suggested '${res.suggested_field || 'field'}' with ${Math.round(res.confidence * 100)}% confidence.`);
    } catch (err: any) {
      // Fallback heuristic if offline
      const val = selectedItem.rawCommandBlock.toLowerCase().includes('enable') || selectedItem.rawCommandBlock.toLowerCase().includes('true');
      setMappedValue(val ? 'true' : 'false');
      showToast('success', 'Local AI heuristic evaluated mapping.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Approve & Save Exemplar to Local History
  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    let parsedVal: any = mappedValue;
    if (mappedValue === 'true') parsedVal = true;
    else if (mappedValue === 'false') parsedVal = false;
    else if (!isNaN(Number(mappedValue)) && mappedValue.trim() !== '') parsedVal = Number(mappedValue);

    exemplarStore.approveAndSaveExemplar(
      selectedItem.id,
      selectedFieldKey,
      parsedVal,
      'SecOps Admin (Browser History)'
    );

    syncLocalState();
    setAiSuggestion(null);
    showToast('success', `Saved exemplar for ${selectedFieldKey}. Generalized across all future audits.`);

    const remainingPending = exemplarStore.getQueue(confidenceGate);
    setSelectedItem(remainingPending.length > 0 ? remainingPending[0] : null);
    onTrainingUpdated?.();
  };

  // Reject Item (Marks as non-compliance-relevant in browser history)
  const handleReject = () => {
    if (!selectedItem) return;
    exemplarStore.rejectQueueItem(selectedItem.id, 'Spurious / Non-relevant syntax block');
    syncLocalState();
    setAiSuggestion(null);
    showToast('reject', 'Marked command as non-compliance-relevant. Retained in rejection audit log.');

    const remainingPending = exemplarStore.getQueue(confidenceGate);
    setSelectedItem(remainingPending.length > 0 ? remainingPending[0] : null);
    onTrainingUpdated?.();
  };

  // Reset / Clear Previous Browser Data Button Handler
  const handleResetPreviousData = () => {
    if (window.confirm('Reset all learned mappings & return queue to initial factory state?')) {
      exemplarStore.resetToDefaults();
      syncLocalState();
      const remainingPending = exemplarStore.getQueue(confidenceGate);
      setSelectedItem(remainingPending.length > 0 ? remainingPending[0] : null);
      showToast('success', 'Reset all learned mappings & training queue to initial factory state.');
      onTrainingUpdated?.();
    }
  };

  // Clear All Saved Data
  const handleClearAllData = () => {
    if (window.confirm('Wipe all training queue items and learned exemplars from browser storage?')) {
      exemplarStore.clearAllData();
      syncLocalState();
      setSelectedItem(null);
      showToast('reject', 'Cleared all browser history data.');
      onTrainingUpdated?.();
    }
  };

  // Register New Baseline Field
  const handleCreateNewField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldKey.trim() || !newFieldLabel.trim()) return;

    const created = exemplarStore.registerBaselineField({
      key: newFieldKey.trim().replace(/\s+/g, '_'),
      label: newFieldLabel.trim(),
      framework: ['cis_v8'],
      valueType: newFieldType,
      description: newFieldLabel.trim(),
    });

    syncLocalState();
    setSelectedFieldKey(created.key);
    setIsCreatingField(false);
    setNewFieldKey('');
    setNewFieldLabel('');
    showToast('success', `Registered new baseline field: ${created.label}`);
  };

  // Delete Individual Exemplar
  const handleDeleteExemplar = (id: string) => {
    exemplarStore.deleteExemplar(id);
    syncLocalState();
    showToast('reject', 'Deleted exemplar from browser history.');
    onTrainingUpdated?.();
  };

  const filteredFields = baselineFields.filter(
    (f) =>
      f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.key.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Header Bar with Clear/Reset Data Actions */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <Brain size={24} className="text-[#C8830A]" weight="bold" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1C1A] tracking-tight font-display">
              AI Training & Baseline Mapping GUI
            </h1>
          </div>
          <p className="text-xs text-[#7C7269] mt-1 max-w-2xl leading-relaxed">
            Administrator-in-the-loop training console. Review low-confidence commands, map them to baseline parameters, and store them in browser history so the engine learns without backend redeployment.
          </p>
        </div>

        {/* Data Reset & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleResetPreviousData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#1E1C1A] border transition-all cursor-pointer bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[#1E1C1A] hover:bg-[#EDE8DF] shadow-2xs"
            title="Reset learned mappings to initial sample state"
          >
            <ArrowCounterClockwise size={14} weight="bold" className="text-[#C8830A]" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 border transition-all cursor-pointer bg-rose-50/60 border-rose-200 hover:bg-rose-100 shadow-2xs"
            title="Clear all browser history data"
          >
            <Trash size={14} weight="bold" />
            <span>Clear Store</span>
          </button>

          <button
            onClick={() => setIsCreatingField(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:brightness-95 active:scale-95"
            style={{ backgroundColor: '#C8830A' }}
          >
            <Plus size={14} weight="bold" />
            <span>New Baseline Field</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs"
          style={{
            backgroundColor: toast.type === 'success' ? '#E6F7F0' : '#FDE8E8',
            borderColor: toast.type === 'success' ? '#2D6A3F' : '#B91C1C',
            color: toast.type === 'success' ? '#2D6A3F' : '#B91C1C',
          }}
        >
          <div className="flex items-center gap-2.5 font-medium">
            {toast.type === 'success' ? <CheckCircle size={18} weight="fill" /> : <XCircle size={18} weight="fill" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 cursor-pointer opacity-70 hover:opacity-100">
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Main 3-Column Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Amber Lane Review Queue & Gate Slider (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <ConfidenceGateSlider
            confidenceThreshold={confidenceGate}
            onChangeThreshold={setConfidenceGate}
            pendingCount={pendingItems.length}
          />

          <div
            className="rounded-xl border overflow-hidden shadow-2xs"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between font-mono text-[11px] font-bold text-[#1E1C1A]"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}
            >
              <span className="uppercase tracking-wider">AMBER LANE QUEUE</span>
              <span className="text-[#C8830A]">{pendingItems.length} PENDING</span>
            </div>

            {/* Vendor Filter Pills */}
            <div className="p-2 border-b flex gap-1.5 overflow-x-auto text-[10px] font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
              {['all', 'cisco_ios', 'juniper_junos', 'sonic', 'arista_eos', 'fortinet_fortios'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVendorFilter(v)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                    vendorFilter === v
                      ? 'bg-[#1E1C1A] text-white font-bold'
                      : 'text-[#7C7269] hover:text-[#1E1C1A] hover:bg-[#EDE8DF]'
                  }`}
                >
                  {v === 'all' ? 'All Vendors' : v.split('_')[0].toUpperCase()}
                </button>
              ))}
            </div>

            {/* Queue Item Cards List */}
            <div className="divide-y divide-[var(--border-subtle)] max-h-[460px] overflow-y-auto">
              {pendingItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7C7269] italic space-y-2">
                  <CheckCircle size={28} className="mx-auto text-[#2D6A3F]" weight="duotone" />
                  <p className="font-semibold text-[#1E1C1A]">Review Queue Clear</p>
                  <p className="text-[11px]">No items pending review below {(confidenceGate * 100).toFixed(0)}% confidence threshold.</p>
                </div>
              ) : (
                pendingItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const vendorInfo = VENDOR_DISPLAY_NAMES[item.vendor];

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectQueueItem(item)}
                      className={`w-full text-left p-3.5 transition-all cursor-pointer flex items-start justify-between gap-3 border-l-4 ${
                        isSelected
                          ? 'border-[#C8830A] bg-[rgba(200,131,10,0.08)] text-[#1E1C1A] font-medium'
                          : 'border-transparent hover:bg-[#F5F0E8] text-[#4A4440]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded border font-bold text-[#1E1C1A] bg-[var(--bg-canvas)] border-[var(--border-default)]">
                            {vendorInfo?.dialect || item.vendor}
                          </span>
                          <span className="text-[10px] font-mono text-[#A89F92]">{item.lineNumbers}</span>
                        </div>
                        <div className="font-mono text-xs text-[#1E1C1A] truncate mt-1">
                          {item.rawCommandBlock}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-[10px] font-bold text-[#A16207] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                          {Math.round(item.confidence * 100)}%
                        </div>
                        <div className="text-[9px] text-[#A89F92] font-mono mt-0.5">Amber</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Command Block & Extensible Mapping Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedItem ? (
            <div
              className="p-4 sm:p-6 rounded-xl border space-y-6 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            >
              {/* Item Header & Reject Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div className="text-xs font-bold text-[#1E1C1A] flex items-center gap-2 flex-wrap">
                    <span>Unrecognized Command Block</span>
                    <span className="font-mono text-[10px] text-[#A16207] px-2 py-0.5 rounded border border-[#FDE68A] bg-[#FEF3C7]">
                      Confidence: {Math.round(selectedItem.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-[#7C7269] mt-1 font-mono">
                    Device: {selectedItem.deviceId} · Vendor: {selectedItem.vendor}
                  </div>
                </div>

                <button
                  onClick={handleReject}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  title="Mark command as non-compliance-relevant"
                >
                  <XCircle size={15} weight="bold" />
                  <span>Reject / Not Relevant</span>
                </button>
              </div>

              {/* Raw CLI Syntax Code Display */}
              <div>
                <div className="text-[11px] font-mono font-bold text-[#7C7269] uppercase tracking-wider mb-2">
                  Captured Raw Command Block
                </div>
                <MonoCodeBlock
                  code={selectedItem.rawCommandBlock || ''}
                  language={selectedItem.vendor}
                  maxHeight="160px"
                  showLineNumbers={false}
                />
              </div>

              {/* AI Auto-Map Trigger Callout Banner */}
              <div className="p-4 rounded-xl border border-[#C8830A]/30 bg-[#FDF7ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1C1A]">
                    <Sparkle size={16} className="text-[#C8830A]" weight="fill" />
                    <span>Opt-In AI Baseline Normalization</span>
                  </div>
                  <div className="text-[11px] text-[#7C7269] mt-0.5 font-sans">
                    Run on-demand AI inference to inspect raw syntax and auto-suggest baseline field mapping.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAskAi}
                  disabled={isAiLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shrink-0 shadow-xs hover:brightness-95 disabled:opacity-50"
                  style={{ backgroundColor: '#C8830A' }}
                >
                  <Sparkle size={14} weight="bold" />
                  <span>{isAiLoading ? 'Analyzing Syntax...' : 'Auto-Map with AI'}</span>
                </button>
              </div>

              {/* Mapping Form */}
              <form onSubmit={handleApprove} className="space-y-5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1E1C1A] uppercase tracking-wider font-mono">
                    Map to Baseline Schema Parameter
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingField(true)}
                    className="text-xs text-[#C8830A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} weight="bold" />
                    <span>Register New Parameter</span>
                  </button>
                </div>

                {/* Field Search & Filter Input */}
                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-[#A89F92]" />
                  <input
                    type="text"
                    placeholder="Search parameters (e.g. sshVersion, telnetEnabled)..."
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-lg border text-xs font-sans outline-none transition-all focus:border-[#C8830A]"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-default)' }}
                  />
                </div>

                {/* Grid of Selectable Baseline Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
                  {filteredFields.map((field) => {
                    const isSelected = selectedFieldKey === field.key;
                    return (
                      <button
                        type="button"
                        key={field.key}
                        onClick={() => setSelectedFieldKey(field.key)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#C8830A] bg-[#FDF7ED] ring-1 ring-[#C8830A]'
                            : 'border-[var(--border-subtle)] hover:bg-[#F5F0E8]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#1E1C1A] truncate">{field.key}</span>
                          {isSelected && <Check size={14} weight="bold" className="text-[#C8830A] shrink-0" />}
                        </div>
                        <div className="text-[11px] text-[#7C7269] mt-0.5 truncate">{field.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Value Input Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1E1C1A] font-mono">
                    Target Standardized Value:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={mappedValue}
                      onChange={(e) => setMappedValue(e.target.value)}
                      placeholder="e.g. 2, 10, true, false"
                      className="flex-1 h-10 px-3.5 rounded-lg border text-xs font-mono outline-none transition-all focus:border-[#C8830A]"
                      style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-default)' }}
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMappedValue('true')}
                        className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          mappedValue === 'true' ? 'bg-[#2D6A3F] text-white border-[#2D6A3F]' : 'bg-[var(--bg-canvas)] border-[var(--border-default)] text-[#1E1C1A]'
                        }`}
                      >
                        true
                      </button>
                      <button
                        type="button"
                        onClick={() => setMappedValue('false')}
                        className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          mappedValue === 'false' ? 'bg-[#B91C1C] text-white border-[#B91C1C]' : 'bg-[var(--bg-canvas)] border-[var(--border-default)] text-[#1E1C1A]'
                        }`}
                      >
                        false
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md hover:brightness-95 active:scale-98"
                  style={{ backgroundColor: '#2D6A3F' }}
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Approve & Save Exemplar Mapping to History</span>
                </button>
              </form>
            </div>
          ) : (
            <div
              className="p-12 rounded-xl border text-center space-y-3"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            >
              <CheckCircle size={36} className="mx-auto text-[#2D6A3F]" weight="duotone" />
              <h3 className="text-base font-bold text-[#1E1C1A]">All Queue Items Reviewed</h3>
              <p className="text-xs text-[#7C7269] max-w-md mx-auto">
                No items remaining in the review queue. All unknown commands have been processed or approved.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Browser History Catalog & Rejection Audit Log */}
      <div
        className="rounded-xl border overflow-hidden shadow-2xs"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex border-b text-xs font-bold" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setBottomTab('exemplars')}
            className={`px-6 py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              bottomTab === 'exemplars'
                ? 'border-[#C8830A] text-[#C8830A] bg-[var(--bg-canvas)]'
                : 'border-transparent text-[#7C7269] hover:text-[#1E1C1A]'
            }`}
          >
            <Database size={16} weight="bold" />
            <span>Learned Exemplars Catalog ({exemplars.length})</span>
          </button>
          <button
            onClick={() => setBottomTab('rejected')}
            className={`px-6 py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              bottomTab === 'rejected'
                ? 'border-[#C8830A] text-[#C8830A] bg-[var(--bg-canvas)]'
                : 'border-transparent text-[#7C7269] hover:text-[#1E1C1A]'
            }`}
          >
            <XCircle size={16} weight="bold" />
            <span>Rejection Audit Log ({exemplarStore.getRejectedAuditLog().length})</span>
          </button>
        </div>

        {bottomTab === 'exemplars' ? (
          <div className="divide-y divide-[var(--border-subtle)] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--bg-canvas)] text-[#7C7269] font-mono text-[10px] uppercase border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Captured Line Pattern</th>
                  <th className="px-4 py-3">Mapped Parameter</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3 text-center">Reused</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {exemplars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#7C7269] italic">
                      No learned exemplars in browser storage. Click 'Reset Data' to load sample exemplars.
                    </td>
                  </tr>
                ) : (
                  exemplars.map((ex) => (
                    <tr key={ex.id} className="hover:bg-[#F9F8F5]">
                      <td className="px-4 py-3 font-mono font-bold text-[#1E1C1A] whitespace-nowrap">{ex.vendor.toUpperCase()}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#4A4440] max-w-xs truncate">{ex.rawLinePattern}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#C8830A]">{ex.mappedFieldKey}</td>
                      <td className="px-4 py-3 font-mono text-[#1E1C1A]">{String(ex.mappedValue)}</td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-[#2D6A3F] font-bold">{ex.timesReused}x</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteExemplar(ex.id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Delete exemplar from browser storage"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--bg-canvas)] text-[#7C7269] font-mono text-[10px] uppercase border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="px-4 py-3">Device / Vendor</th>
                  <th className="px-4 py-3">Rejected Command Block</th>
                  <th className="px-4 py-3">Rejection Reason</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {exemplarStore.getRejectedAuditLog().length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-[#7C7269] italic">
                      No rejected command blocks recorded.
                    </td>
                  </tr>
                ) : (
                  exemplarStore.getRejectedAuditLog().map((item) => (
                    <tr key={item.id} className="hover:bg-[#F9F8F5]">
                      <td className="px-4 py-3 font-mono font-bold text-[#1E1C1A] whitespace-nowrap">{item.deviceId} ({item.vendor})</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#B91C1C] max-w-xs truncate">{item.rawCommandBlock}</td>
                      <td className="px-4 py-3 text-[#4A4440]">{item.rejectionReason || 'Spurious syntax block'}</td>
                      <td className="px-4 py-3 text-right font-mono text-[10px] text-[#A89F92]">{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register New Field Modal */}
      {isCreatingField && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#D1CBC0] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[#1E1C1A]">Register New Baseline Parameter</h3>
              <button onClick={() => setIsCreatingField(false)} className="p-1 text-[#7C7269] hover:text-[#1E1C1A]">
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreateNewField} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1E1C1A] block mb-1">Parameter Key Name (camelCase):</label>
                <input
                  type="text"
                  placeholder="e.g. maxSessionTimeout"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border font-mono outline-none focus:border-[#C8830A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1E1C1A] block mb-1">Human Label / Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Maximum Session Idle Timeout"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border font-sans outline-none focus:border-[#C8830A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1E1C1A] block mb-1">Value Type:</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border font-mono outline-none focus:border-[#C8830A]"
                >
                  <option value="boolean">boolean (true / false)</option>
                  <option value="number">number (numeric value)</option>
                  <option value="string">string (text / string value)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingField(false)}
                  className="px-4 py-2 rounded-lg font-bold border text-[#7C7269]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-white bg-[#C8830A]"
                >
                  Register Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
