import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, ShieldCheck, LockKey, HardDrives, 
  ArrowRight, FileCode, MagnifyingGlass
} from '@phosphor-icons/react';

export const LivePullExplanation: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      title: '1. Secure Connection',
      desc: 'NetSentry initiates an SSH session to the target device using unprivileged, read-only credentials.',
      icon: <LockKey size={20} weight="fill" className="text-[#C8830A]" />
    },
    {
      title: '2. Non-Intrusive Retrieval',
      desc: 'Executes safe, deterministic commands (e.g., `show run`, `display current-configuration`) with zero risk of modification.',
      icon: <Terminal size={20} weight="fill" className="text-[#2D6A3F]" />
    },
    {
      title: '3. Client-Side Masking',
      desc: 'Before data ever leaves the local memory, passwords, hashes, and SNMP strings are redacted and masked.',
      icon: <ShieldCheck size={20} weight="fill" className="text-[#1E1C1A]" />
    },
    {
      title: '4. Audit Ready',
      desc: 'The sanitized telemetry is ingested into the NetSentry engine for compliance mapping against CIS/STIG frameworks.',
      icon: <MagnifyingGlass size={20} weight="fill" className="text-blue-600" />
    }
  ];

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="p-5 md:p-8 flex flex-col items-center border-b bg-slate-50 relative overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
        
        {/* Animated Network Diagram */}
        <div className="relative w-full max-w-2xl h-48 flex items-center justify-between z-10 px-4 md:px-12">
          {/* Node 1: NetSentry */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500 ${step === 0 || step === 3 ? 'bg-[#1E1C1A] text-white scale-110' : 'bg-white border text-slate-400'}`}>
              <ShieldCheck size={28} weight={step === 0 || step === 3 ? "fill" : "regular"} />
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">NetSentry</span>
          </div>

          {/* Connection Path */}
          <div className="flex-1 h-0.5 bg-slate-200 mx-4 relative flex items-center justify-center">
            {/* Animated Packet */}
            <AnimatePresence mode="popLayout">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ left: '0%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="absolute w-8 h-8 -ml-4 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center z-20 shadow-sm"
                >
                  <LockKey size={14} className="text-orange-600" weight="fill" />
                </motion.div>
              )}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ left: '100%' }}
                  animate={{ left: '100%' }}
                  className="absolute w-8 h-8 -ml-4 rounded-full bg-green-100 border border-green-300 flex items-center justify-center z-20 shadow-sm"
                >
                  <Terminal size={14} className="text-green-600" weight="fill" />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ left: '100%' }}
                  animate={{ left: '0%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="absolute w-8 h-8 -ml-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center z-20 shadow-sm"
                >
                  <FileCode size={14} className="text-slate-600" weight="fill" />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ left: '0%' }}
                  animate={{ left: '0%' }}
                  className="absolute w-8 h-8 -ml-4 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center z-20 shadow-sm"
                >
                  <MagnifyingGlass size={14} className="text-blue-600" weight="bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Node 2: Target Device */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500 ${step === 1 || step === 2 ? 'bg-[#C8830A] text-white scale-110' : 'bg-white border text-slate-400'}`}>
              <HardDrives size={28} weight={step === 1 || step === 2 ? "fill" : "regular"} />
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">Target Router</span>
          </div>
        </div>
      </div>

      {/* Description Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x bg-white" style={{ borderColor: 'var(--border-subtle)' }}>
        {steps.map((s, idx) => (
          <button 
            key={idx}
            onClick={() => setStep(idx)}
            className={`p-5 text-left transition-colors hover:bg-slate-50 cursor-pointer ${step === idx ? 'bg-orange-50/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              {s.icon}
              {step === idx && (
                <motion.div layoutId="activeIndicator" className="w-1.5 h-1.5 rounded-full bg-[#C8830A]" />
              )}
            </div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${step === idx ? 'text-[#C8830A]' : 'text-slate-900'}`}>
              {s.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {s.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
