// src/components/shell/TopBar.tsx
// Persistent top navigation bar — Institutional Light Mode
// Warm stone palette, saffron-gold accent. Clean ApexNet brand hyperlink.

import React from 'react';
import {
  Play, ArrowSquareOut, CheckCircle, XCircle, MagnifyingGlass,
  Bell, Question, ArrowLeft, Shield,
} from '@phosphor-icons/react';
import { SupportedVendor, VENDOR_DISPLAY_NAMES } from '../../types/canonical';
import { ActiveNavTab } from './NavRail';

interface TopBarProps {
  currentDeviceName: string;
  currentVendor: SupportedVendor;
  complianceScore: number;
  passCount: number;
  failCount: number;
  isAuditing?: boolean;
  activeTab?: ActiveNavTab;
  onExecuteAudit: () => void;
  onViewPublicOverview: () => void;
  onBackToDashboard?: () => void;
  onViewLandingPage?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDeviceName,
  currentVendor,
  complianceScore,
  passCount,
  failCount,
  isAuditing = false,
  activeTab,
  onExecuteAudit,
  onViewPublicOverview,
  onBackToDashboard,
  onViewLandingPage,
}) => {
  const vendorInfo = VENDOR_DISPLAY_NAMES[currentVendor] || { name: 'Multi-Vendor', dialect: 'Standard' };

  const scoreColor =
    complianceScore >= 80
      ? 'var(--status-pass)'
      : complianceScore >= 60
      ? 'var(--status-warn)'
      : 'var(--status-fail)';

  const showBackButton = activeTab && activeTab !== 'dashboard';
  const handleLandingClick = onViewLandingPage || onViewPublicOverview;

  return (
    <header
      className="h-14 border-b px-3 sm:px-5 flex items-center justify-between shrink-0 select-none z-20 backdrop-blur-sm sticky top-0 gap-2 sm:gap-4 overflow-hidden"
      style={{ backgroundColor: 'rgba(237,234,228,0.95)', borderColor: 'var(--border-default)' }}
    >
      {/* Left: Premium Back Button + Device Context / Brand Hyperlink */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-3 overflow-hidden">
        
        {/* Stylish Premium Back Button (Only on sub-pages, NOT on Dashboard or Landing) */}
        {showBackButton && (
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-bold text-[#1E1C1A] border transition-all cursor-pointer hover:bg-[#EDE8DF] hover:border-[#1E1C1A] active:scale-95 shadow-xs shrink-0"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-default)',
            }}
            title="Back to Fleet Dashboard"
          >
            <ArrowLeft size={13} weight="bold" className="text-[#C8830A]" />
            <span className="hidden xs:inline">Back</span>
          </button>
        )}

        {/* Hyperlinked ApexNet Brand / Logo */}
        <button
          onClick={handleLandingClick}
          className={`${showBackButton ? 'hidden sm:flex' : 'flex'} items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left shrink-0 group`}
          title="ApexNet - Return to Public Landing Page"
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center border shrink-0 bg-[rgba(200,131,10,0.10)] border-[rgba(200,131,10,0.30)] group-hover:scale-105 transition-transform"
          >
            <Shield size={14} weight="bold" className="text-[#C8830A]" />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A3F] animate-pulse" />
            <span className="text-xs font-extrabold text-[#1E1C1A] truncate group-hover:text-[#C8830A] transition-colors">
              ApexNet Perimeter
            </span>
            <span className="text-[#D1CBC0] text-xs">·</span>
          </div>
        </button>

        {/* Target Node Details */}
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="text-[#A89F92] text-xs hidden lg:inline shrink-0">Target Node:</span>
          <span className="text-xs font-semibold text-[#2E2B28] truncate font-mono max-w-[90px] xs:max-w-[130px] sm:max-w-[180px] md:max-w-[220px]" title={currentDeviceName}>
            {currentDeviceName}
          </span>
          <span
            className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border hidden 2xl:inline shrink-0"
            style={{
              backgroundColor: 'rgba(200,131,10,0.08)',
              borderColor: 'rgba(200,131,10,0.25)',
              color: '#7C4F04',
            }}
          >
            {vendorInfo.dialect}
          </span>
        </div>
      </div>

      {/* Center: Command Search */}
      <div className="hidden 2xl:flex items-center relative max-w-[200px] w-full mx-2 shrink">
        <MagnifyingGlass size={13} className="absolute left-3 text-[#A89F92] pointer-events-none" />
        <input
          type="text"
          placeholder="Search rules (e.g. /ac-1)..."
          className="w-full h-8 pl-8 pr-10 rounded-md border text-xs font-sans transition-all focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#C8830A'; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-default)'; }}
        />
        <kbd
          className="absolute right-2 top-1.5 text-[9px] font-mono border px-1 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-tertiary)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right: Telemetry & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto whitespace-nowrap">
        {/* Pass/Fail counts + Score */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono shrink-0">
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--status-pass)' }}>
              <CheckCircle size={14} weight="fill" />
              <span>{passCount}</span>
            </span>
            <span className="text-[#D1CBC0]">/</span>
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--status-fail)' }}>
              <XCircle size={14} weight="fill" />
              <span>{failCount}</span>
            </span>
          </div>

          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-mono shrink-0"
            style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-default)' }}
          >
            <span className="text-[#A89F92] text-[10px] uppercase font-sans font-semibold hidden xs:inline">SCORE:</span>
            <span className="font-bold tabular font-chakra text-xs sm:text-sm" style={{ color: scoreColor }}>
              {complianceScore}%
            </span>
          </div>
        </div>

        {/* Run Audit Action */}
        <button
          onClick={onExecuteAudit}
          disabled={isAuditing}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-[#C8830A] hover:bg-[#A66A06] active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap shadow-xs cursor-pointer transition-all"
          title="Run Compliance Audit"
        >
          <Play size={13} weight="bold" />
          <span>{isAuditing ? 'Evaluating...' : 'Run Audit'}</span>
        </button>

        {/* Utility Icons */}
        <div className="hidden xl:flex items-center gap-0.5 text-[#A89F92] border-l pl-2 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            className="p-1 rounded-md transition-colors cursor-pointer hover:text-[#4A4440]"
            title="Notifications"
          >
            <Bell size={15} />
          </button>
          <button
            className="p-1 rounded-md transition-colors cursor-pointer hover:text-[#4A4440]"
            title="Documentation"
          >
            <Question size={15} />
          </button>
        </div>

        {/* Public Gateway Hyperlink */}
        <button
          onClick={handleLandingClick}
          className="hidden 2xl:flex items-center gap-1.5 text-xs text-[#7C7269] hover:text-[#C8830A] font-bold transition-colors cursor-pointer shrink-0"
          title="ApexNet - Return to Landing Page"
        >
          <span>Landing Page</span>
          <ArrowSquareOut size={12} weight="bold" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
