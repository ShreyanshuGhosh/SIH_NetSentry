import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, ShieldCheck, LockKey, HardDrives, 
  ArrowRight, FileCode, MagnifyingGlass, CheckCircle, Robot, Key
} from '@phosphor-icons/react';

export const LivePullExplanation: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 4000); // 4 seconds per stage for complex reading
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
      desc: 'Executes safe, deterministic commands (e.g., `show run`) with zero risk of modification.',
      icon: <Terminal size={20} weight="fill" className="text-[#2D6A3F]" />
    },
    {
      title: '3. Client-Side Masking',
      desc: 'Before data leaves local memory, passwords, hashes, and SNMP strings are redacted and masked.',
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
        <div className="relative w-full max-w-4xl h-64 flex items-center justify-between z-10 px-4 md:px-12 mx-auto">
          
          {/* Background Decor - Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20"
               style={{ backgroundImage: 'radial-gradient(#C8830A 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

          {/* Node 1: NetSentry */}
          <div className="flex flex-col items-center gap-3 relative z-20 w-32">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${step === 0 || step === 3 ? 'bg-[#1E1C1A] text-white scale-110' : 'bg-white border text-slate-400'}`}>
              <ShieldCheck size={32} weight={step === 0 || step === 3 ? "fill" : "regular"} />
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 bg-white/80 px-2 rounded">NetSentry</span>
            
            {/* Step 3: Audit Badges appearing around NetSentry */}
            <AnimatePresence>
              {step === 3 && (
                <>
                  <motion.div initial={{ scale: 0, x: -20, y: -20 }} animate={{ scale: 1, x: -40, y: -40 }} exit={{ scale: 0 }} className="absolute bg-green-100 text-green-700 text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-green-300 shadow-sm flex items-center gap-1">
                    <CheckCircle weight="fill" /> CIS PASS
                  </motion.div>
                  <motion.div initial={{ scale: 0, x: 20, y: -20 }} animate={{ scale: 1, x: 35, y: 15 }} exit={{ scale: 0 }} className="absolute bg-blue-100 text-blue-700 text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-blue-300 shadow-sm">
                    STIG OK
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Connection Path / Action Zone */}
          <div className="flex-1 h-32 mx-4 relative flex items-center justify-center">
            
            {/* Base line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -mt-[1px]" />
            
            {/* Step 0: SSH Handshake Tunnel */}
            <AnimatePresence>
              {step === 0 && (
                <motion.div 
                  initial={{ width: '0%' }} 
                  animate={{ width: '100%' }} 
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute top-1/2 left-0 h-1 bg-orange-400/50 -mt-[2px] border-y border-orange-500/30"
                />
              )}
            </AnimatePresence>
            
            {/* The animated objects track */}
            <div className="w-full h-full relative z-30">
              
              <AnimatePresence mode="popLayout">
                {/* Step 0: Key sent to Router */}
                {step === 0 && (
                  <motion.div
                    key="ssh-key"
                    initial={{ left: '0%', opacity: 1 }}
                    animate={{ left: '85%' }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className="absolute top-1/2 -translate-y-1/2 -ml-6"
                  >
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-1.5 shadow-sm flex items-center gap-2">
                      <LockKey size={14} className="text-orange-600" weight="fill" />
                      <span className="text-[9px] font-mono font-bold text-orange-700 hidden sm:block pr-1">SSH:22 Auth</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Request Command */}
                {step === 1 && (
                  <motion.div
                    key="req-cmd"
                    initial={{ left: '90%', opacity: 0, scale: 0.8 }}
                    animate={{ left: '85%', opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[20%] -translate-y-1/2 -ml-16"
                  >
                    <div className="bg-slate-800 text-green-400 font-mono text-[10px] px-3 py-1.5 rounded-md shadow-md whitespace-nowrap border border-slate-700">
                      <span className="text-slate-400">#</span> show running-config
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Raw Config Flowing Back */}
                {step === 1 && (
                  <motion.div
                    key="raw-config"
                    initial={{ left: '85%', opacity: 0 }}
                    animate={{ left: '0%', opacity: 1 }}
                    transition={{ duration: 2.5, ease: 'linear' }}
                    className="absolute top-1/2 -translate-y-1/2 -ml-6"
                  >
                    <div className="bg-red-50 border border-red-200 rounded p-2 shadow-sm flex flex-col gap-1 w-32">
                      <div className="h-1 w-full bg-slate-300 rounded" />
                      <div className="text-[8px] font-mono text-red-600 font-bold leading-none">enable secret 5 $1$mER...</div>
                      <div className="h-1 w-3/4 bg-slate-300 rounded" />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Redaction Scrubber in Middle */}
                {step === 2 && (
                  <motion.div
                    key="scrubber-box"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
                  >
                    <div className="bg-slate-900 border-2 border-[#C8830A] rounded-xl p-3 shadow-xl flex flex-col items-center">
                      <Robot size={24} weight="duotone" className="text-[#C8830A] animate-pulse" />
                      <span className="text-[9px] font-mono font-bold text-white mt-1 uppercase">Redaction Engine</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Raw data going INTO scrubber */}
                {step === 2 && (
                  <motion.div
                    key="raw-to-scrubber"
                    initial={{ left: '80%', opacity: 0 }}
                    animate={{ left: '50%', opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'linear' }}
                    className="absolute top-1/2 -translate-y-1/2 -ml-6"
                  >
                    <div className="bg-red-50 border border-red-200 rounded p-1.5 shadow-sm flex items-center gap-1">
                      <Key size={12} className="text-red-600" />
                      <span className="text-[8px] font-mono text-red-600 font-bold">password 7 0101...</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Clean data coming OUT of scrubber */}
                {step === 2 && (
                  <motion.div
                    key="clean-from-scrubber"
                    initial={{ left: '50%', opacity: 0 }}
                    animate={{ left: '10%', opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'linear', delay: 1.2 }}
                    className="absolute top-1/2 -translate-y-1/2 -ml-6"
                  >
                    <div className="bg-green-50 border border-green-200 rounded p-1.5 shadow-sm flex items-center gap-1">
                      <ShieldCheck size={12} className="text-green-600" weight="fill" />
                      <span className="text-[8px] font-mono text-green-700 font-bold">password 7 *****</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Audit Engine Scanning */}
                {step === 3 && (
                  <motion.div
                    key="audit-scan"
                    initial={{ left: '15%', opacity: 0, y: -20 }}
                    animate={{ left: '20%', opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-1/2 -translate-y-1/2 -ml-8"
                  >
                    <div className="relative">
                      <div className="bg-slate-50 border border-slate-300 rounded p-2 shadow-sm w-24">
                        <div className="text-[7px] font-mono text-slate-500 leading-tight">hostname RTR-01<br/>password *****<br/>ssh version 2</div>
                      </div>
                      {/* Scanning Loupe */}
                      <motion.div 
                        animate={{ x: [0, 40, 0], y: [0, 15, 0] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-3 -left-3 text-blue-500 drop-shadow-md"
                      >
                        <MagnifyingGlass size={24} weight="bold" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Node 2: Target Device */}
          <div className="flex flex-col items-center gap-3 relative z-20 w-32">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${step === 1 || step === 2 ? 'bg-[#C8830A] text-white scale-110' : 'bg-white border text-slate-400'}`}>
              <HardDrives size={32} weight={step === 1 || step === 2 ? "fill" : "regular"} />
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 bg-white/80 px-2 rounded text-center">Target Router</span>
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
