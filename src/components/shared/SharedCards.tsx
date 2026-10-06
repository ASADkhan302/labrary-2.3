import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { CountUp } from '../ui/count-up';

/**
 * 1. ITEM CARD (Loans, Members)
 * surface-1 (#1A1A1A), radius 14, 1px border-subtle (#2E2A33), padding 16.
 * Hover: border purple-light at 45% (#A66BC9), lift 2px (180ms, transform & shadow only).
 */
export interface ItemCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  children,
  className = '',
  onClick,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`relative rounded-[14px] bg-[#1A1A1A] border border-[#2E2A33] p-4 flex flex-col justify-between transition-all duration-[180ms] ease-out hover:border-[#A66BC9]/45 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * 2. PANEL CARD (Reports, Migration)
 * surface-1 (#1A1A1A), radius 14, 1px border-subtle (#2E2A33), padding 20.
 * Top decorative hairline, optional hover lift if clickable.
 */
export interface PanelCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  hairlineColor?: string; // e.g. '#BC881B' or '#A66BC9'
  className?: string;
  onClick?: () => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  hairlineColor,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-[14px] bg-[#1A1A1A] border border-[#2E2A33] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden flex flex-col ${
        onClick
          ? 'cursor-pointer transition-all duration-[180ms] ease-out hover:border-[#A66BC9]/45 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
          : ''
      } ${className}`}
    >
      {hairlineColor && (
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ backgroundColor: hairlineColor }} 
        />
      )}

      {(title || headerAction) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#2E2A33]">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-[15px] font-bold text-white tracking-tight leading-snug">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[12px] text-[#B3AABD] mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

/**
 * 3. KPI CARD (Reports Overview)
 * label, value, short sub-label, optional slim bar, optional real trend badge.
 */
export interface KpiCardProps {
  label: string;
  value: number;
  subLabel?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  accentBarColor?: string;
  percentBar?: {
    value: number;
    max: number;
    color?: string;
  };
  trend?: {
    percentage: number;
    direction: 'up' | 'down';
    label: string;
  };
  isDanger?: boolean;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subLabel,
  icon: Icon,
  iconColor = '#E0B450',
  accentBarColor,
  percentBar,
  trend,
  isDanger = false,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-[14px] bg-[#1A1A1A] border ${
        isDanger ? 'border-rose-500/40 bg-rose-950/10' : 'border-[#2E2A33]'
      } p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-[180ms] hover:border-[#6F6879] ${className}`}
    >
      {accentBarColor && (
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ backgroundColor: accentBarColor }} 
        />
      )}

      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold text-[#B3AABD] uppercase tracking-[0.06em]">
          {label}
        </span>
        {Icon && (
          <div 
            className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: isDanger ? 'rgba(251, 113, 133, 0.15)' : 'rgba(188, 136, 27, 0.15)',
              borderColor: isDanger ? 'rgba(251, 113, 133, 0.3)' : 'rgba(188, 136, 27, 0.3)',
              color: isDanger ? '#FB7185' : iconColor,
            }}
          >
            <Icon className="w-4 h-4 stroke-[2]" />
          </div>
        )}
      </div>

      {/* Value & Trend */}
      <div className="my-2 flex items-baseline justify-between gap-3 flex-wrap">
        <div 
          className={`text-[28px] sm:text-[32px] font-bold font-mono tracking-tight tabular-nums leading-none ${
            isDanger ? 'text-rose-400' : 'text-white'
          }`}
        >
          <CountUp end={value} durationMs={600} />
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
              trend.direction === 'up'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.percentage)}%</span>
          </div>
        )}
      </div>

      {/* Optional Slim Bar */}
      {percentBar && (
        <div className="space-y-1 mb-2">
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, percentBar.max > 0 ? (percentBar.value / percentBar.max) * 100 : 0))}%`,
                backgroundColor: percentBar.color || '#34D399',
              }}
            />
          </div>
        </div>
      )}

      {/* Subtitle / Sub-label */}
      {subLabel && (
        <div className="text-[12px] text-[#B3AABD] leading-snug font-sans">
          {subLabel}
        </div>
      )}
    </div>
  );
};
