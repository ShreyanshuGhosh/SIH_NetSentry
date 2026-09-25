import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadSimple, FileCode, CheckCircle, ShieldCheck, XCircle, 
  LockKey, Cursor, TerminalWindow, Sparkle, Target, 
  ShieldWarning, ChartDonut, HardDrives
} from '@phosphor-icons/react';

export const AnimatedProductDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (step === 0) timeout = setTimeout(() => setStep(1), 2000); 
    else if (step === 1) timeout = setTimeout(() => setStep(2), 800);  
    else if (step === 2) timeout = setTimeout(() => setStep(3), 3500); 
    else if (step === 3) timeout = setTimeout(() => setStep(0), 5000); 
    return () => clearTimeout(timeout);
  }, [step]);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden text-[#1E1C1A] font-sans">
      
      {/* Fake OS Window Chrome */}
      <div className="h-7 sm:h-8 border-b border-[#E4E0D8] flex items-center px-3 sm:px-4 bg-[#F5F4F0] shrink-0 z-10 relative">
        <div className="flex gap-1.5 absolute left-3 sm:left-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
        </div>
        <div className="w-full text-center text-[9px] sm:text-[10px] font-mono font-bold text-[#7C7269] flex items-center justify-center gap-2">
          <ShieldCheck size={12} weight="fill" className="text-[#C8830A]" />
          NetSentry Active Workspace
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Slim Sidebar */}
        <div className="w-12 sm:w-14 border-r border-[#E4E0D8] bg-[#FAFAF8] flex flex-col items-center py-4 gap-6 shrink-0 z-10">
          <div className="w-8 h-8 rounded-lg bg-[#C8830A]/10 text-[#C8830A] flex items-center justify-center shadow-inner">
            <Target size={18} weight="fill" />
          </div>
          <div className="w-8 h-8 rounded-lg text-[#A89F92] flex items-center justify-center">
            <HardDrives size={18} />
          </div>
          <div className="w-8 h-8 rounded-lg text-[#A89F92] flex items-center justify-center">
            <ChartDonut size={18} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative bg-white overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* STAGE 1: Drag & Drop Full-Bleed View */}
            {step < 2 && (
              <motion.div
                key="stage-upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 p-6 sm:p-10 flex flex-col"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#1E1C1A]">Initialize Audit</h2>
                  <p className="text-[11px] text-[#7C7269]">Secure local ingestion. Zero data retention.</p>
                </div>
                
                <div className="flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors relative"
                     style={{ borderColor: step === 1 ? '#C8830A' : '#D1CBC0', backgroundColor: step === 1 ? 'rgba(200,131,10,0.02)' : '#FAFAF8' }}>
                  
                  <motion.div 
                    animate={step === 1 ? { scale: [1, 1.1, 1] } : {}}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white shadow-sm border border-[#E4E0D8]" 
                  >
                     {step === 0 ? (
                       <UploadSimple size={28} weight="bold" color="#A89F92" />
                     ) : (
                       <FileCode size={28} weight="fill" color="#C8830A" />
                     )}
                  </motion.div>
                  <p className="text-sm font-bold text-[#1E1C1A]">
                    {step === 0 ? 'Drag configuration file here' : 'core-switch-dc1.cfg'}
                  </p>
                  
                  {/* The Mouse Pointer doing the drag-and-drop */}
                  {step === 0 && (
                    <motion.div
                      className="absolute z-20 pointer-events-none"
                      initial={{ x: 250, y: 150, opacity: 0 }}
                      animate={{ x: 0, y: 0, opacity: 1 }}
                      transition={{ duration: 1.2, ease: "circOut", delay: 0.2 }}
                    >
                      <div className="relative flex flex-col items-center">
                        <motion.div
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{ delay: 0.8 }}
                           className="bg-white p-2 rounded-lg shadow-xl border border-[#E4E0D8] mb-1 flex items-center gap-2 text-[10px] font-mono text-[#1E1C1A]"
                        >
                          <FileCode size={16} weight="fill" className="text-[#C8830A]" />
                          core-switch-dc1.cfg
                        </motion.div>
                        <Cursor size={28} weight="fill" className="text-[#1E1C1A] drop-shadow-md -ml-6" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STAGE 2: Live Engine Processing (Split View) */}
            {step === 2 && (
              <motion.div
                key="stage-processing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex"
              >
                {/* Left: Raw Config Feed */}
                <div className="w-1/2 h-full border-r border-[#E4E0D8] bg-[#FAFAF8] p-4 flex flex-col">
                  <div className="text-[10px] font-mono font-bold text-[#A89F92] mb-3 uppercase">Memory Stream</div>
                  <div className="flex-1 overflow-hidden relative">
                    <motion.div 
                      initial={{ y: 50 }} animate={{ y: -80 }} transition={{ duration: 3, ease: "linear" }}
                      className="font-mono text-[9px] sm:text-[10px] text-[#7C7269] space-y-1"
                    >
                      <div>hostname core-switch-dc1</div>
                      <div>!</div>
                      <div>aaa new-model</div>
                      <div>aaa authentication login default local</div>
                      <div className="bg-[#C8830A]/20 text-[#C8830A] px-1 rounded inline-block">enable secret 9 [REDACTED_BY_NETSENTRY]</div>
                      <div>!</div>
                      <div>ip domain-name enterprise.local</div>
                      <div>crypto key generate rsa modulus 2048</div>
                      <div className="bg-[#2D6A3F]/20 text-[#1E4D2B] px-1 rounded inline-block">ip ssh version 2</div>
                      <div>!</div>
                      <div>interface GigabitEthernet0/0</div>
                      <div> description OUTSIDE_LINK</div>
                      <div> ip address 192.0.2.1 255.255.255.0</div>
                      <div className="bg-[#B91C1C]/10 text-[#B91C1C] px-1 rounded inline-block">! MISSING: ip access-group BOUNDARY in</div>
                    </motion.div>
                    {/* Fade out bottom/top */}
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#FAFAF8] to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#FAFAF8] to-transparent" />
                  </div>
                </div>

                {/* Right: Engine Terminal */}
                <div className="w-1/2 h-full bg-[#111110] p-4 flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#888] mb-4">
                    <TerminalWindow size={14} /> Deterministic Evaluator
                  </div>
                  <div className="flex-1 overflow-hidden relative font-mono text-[9px] sm:text-[10px] space-y-1.5">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                      <span className="text-[#666]">0.01s</span> <span className="text-green-400">[GREEN_LANE]</span> Matched IOS-XE AST
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                      <span className="text-[#666]">0.04s</span> <span className="text-yellow-400">[REDACT]</span> Secrets neutralized
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                      <span className="text-[#666]">0.08s</span> <span className="text-gray-300">Evaluating CIS-1.1.4 (SSHv2)... </span>
                      <span className="text-green-400 font-bold">PASS</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>
                      <span className="text-[#666]">0.11s</span> <span className="text-gray-300">Evaluating NIST SC-7 (Boundary)... </span>
                      <span className="text-red-400 font-bold">FAIL</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }} className="mt-3 text-[#58A6FF] flex items-center gap-1.5">
                      <Sparkle size={12} weight="fill" /> Finalizing compliance signature...
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 3: Final Audit Report (Split Dashboard) */}
            {step === 3 && (
              <motion.div
                key="stage-report"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col sm:flex-row p-4 gap-4"
              >
                {/* Left side: Overview Card */}
                <div className="w-full sm:w-2/5 flex flex-col gap-4">
                  <div className="bg-[#FAFAF8] border border-[#E4E0D8] rounded-xl p-4 flex-1 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                    {/* Decorative background arc */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border-[10px] border-[#2D6A3F]/5"></div>
                    
                    <div className="text-[10px] font-mono text-[#A89F92] uppercase tracking-widest mb-1">Total Score</div>
                    <div className="text-5xl sm:text-6xl font-black font-mono text-[#2D6A3F] tracking-tighter mb-2">87<span className="text-2xl sm:text-3xl text-[#7C7269]">%</span></div>
                    
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2D6A3F]/10 border border-[#2D6A3F]/20 text-[#1E4D2B] text-[9px] font-bold uppercase mb-4">
                      <CheckCircle size={10} weight="fill" /> Cryptographically Signed
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-2 text-left mt-2">
                      <div className="bg-white border border-[#E4E0D8] p-2 rounded-lg">
                        <div className="text-[9px] font-mono text-[#A89F92]">PASSED</div>
                        <div className="text-sm font-bold text-[#1E1C1A]">24 Rules</div>
                      </div>
                      <div className="bg-[#FF5F56]/5 border border-[#FF5F56]/20 p-2 rounded-lg">
                        <div className="text-[9px] font-mono text-[#B91C1C]">FAILED</div>
                        <div className="text-sm font-bold text-[#B91C1C]">2 Rules</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Evidence List */}
                <div className="w-full sm:w-3/5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                     <div className="text-xs font-bold text-[#1E1C1A]">Key Findings</div>
                     <div className="text-[9px] font-mono text-[#7C7269]">EDGE-SW01</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2">
                    {/* Pass Item */}
                    <div className="border border-[#E4E0D8] rounded-lg p-3 flex gap-3 bg-white shadow-sm hover:border-[#C8830A] transition-colors">
                      <CheckCircle size={16} weight="fill" className="text-[#2D6A3F] shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-[#1E1C1A]">SSHv2 Enforcement</span>
                          <span className="text-[9px] font-mono bg-[#FAFAF8] border border-[#E4E0D8] px-1.5 rounded text-[#7C7269]">PASS</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#7C7269] bg-[#FAFAF8] px-1.5 py-0.5 rounded inline-block">ip ssh version 2</div>
                      </div>
                    </div>
                    
                    {/* Pass Item */}
                    <div className="border border-[#E4E0D8] rounded-lg p-3 flex gap-3 bg-white shadow-sm">
                      <CheckCircle size={16} weight="fill" className="text-[#2D6A3F] shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-[#1E1C1A]">Telnet Disabled</span>
                          <span className="text-[9px] font-mono bg-[#FAFAF8] border border-[#E4E0D8] px-1.5 rounded text-[#7C7269]">PASS</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#7C7269] bg-[#FAFAF8] px-1.5 py-0.5 rounded inline-block">no service telnet</div>
                      </div>
                    </div>

                    {/* Fail Item */}
                    <div className="border border-red-200 rounded-lg p-3 flex gap-3 bg-red-50/30 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B91C1C]"></div>
                      <ShieldWarning size={16} weight="fill" className="text-[#B91C1C] shrink-0 ml-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-[#1E1C1A] flex items-center gap-1.5">
                            Boundary Protection
                            <span className="bg-red-100 text-red-700 text-[8px] font-mono px-1 rounded uppercase">High</span>
                          </span>
                          <span className="text-[9px] font-mono bg-red-100 border border-red-200 px-1.5 rounded text-red-700 font-bold">FAIL</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#B91C1C] bg-red-50 px-1.5 py-0.5 rounded inline-block">line 40: missing ACL inbound</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fake Cursor Interaction */}
                  <motion.div
                    className="absolute z-20 pointer-events-none"
                    initial={{ x: 50, y: 250, opacity: 0 }}
                    animate={{ x: 200, y: 150, opacity: 1, scale: [1, 0.9, 1] }}
                    transition={{ delay: 1.5, duration: 1.5, ease: "circOut" }}
                  >
                    <Cursor size={28} weight="fill" className="text-[#1E1C1A] drop-shadow-md" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Absolute Loading Bar Overlay */}
      <div className="absolute bottom-0 left-0 h-1 bg-[#C8830A] z-50 transition-all duration-300 ease-linear" 
           style={{ width: step === 0 ? '0%' : step === 1 ? '25%' : step === 2 ? '70%' : '100%' }} />
    </div>
  );
};
