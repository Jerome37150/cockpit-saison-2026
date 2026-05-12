import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart,
} from 'recharts';
import {
  LayoutDashboard, Target, Mail, Building2,
  TrendingUp, TrendingDown, AlertTriangle, Calendar,
  CheckCircle2, AlertCircle, Lightbulb, Zap, Users,
  Eye, X, ChevronLeft, ChevronRight, Search, Activity, Sparkles,
  Lock, LogOut,
} from 'lucide-react';

import {
  MONTHS, MONTH_LABELS,
  GLOBAL, GLOBAL_N1, GLOBAL_OBJ,
  PORTAILS, PORTAIL_ORIGINE, CANAUX,
  SEO_PERF, SEO_MARCHES, SEO_PER_PORTAIL,
  SEA_PERF, SEA_PAYS,
  CRM_BASE, CRM_NL, CRM_CAMPAGNES,
  SEA_CAMPAGNES, SEA_TYPE_COLORS,
  BUDGET_LEVIERS, CA_PRODUITS, CAMPINGS,
  CLIENTS,
  SYNCED_AT,
} from './data';

/* =========================================================================
   HELPERS DE FORMATAGE
   ========================================================================= */

const fmt = (n) => {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(0);
};
const fmtFull = (n) => (n === null || n === undefined ? '—' : n.toLocaleString('fr-FR'));
const fmtPct = (n, decimals = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? '—' : (n * 100).toFixed(decimals) + '%';
const fmtEuro = (n) =>
  n === null || n === undefined || Number.isNaN(n)
    ? '—'
    : n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
const evo = (n, n1) =>
  n === null || n === undefined || n1 === null || n1 === undefined || !n1 ? null : (n - n1) / n1;

const COLORS = {
  primary: '#22D3CC',
  primaryDim: '#0E9E96',
  primaryLight: '#7FE6E0',
  bg: '#000000',
  surface: '#0A0A0A',
  surface2: '#141414',
  border: '#1F1F1F',
  text: '#F5F5F5',
  muted: '#888888',
  good: '#22D3CC',
  warn: '#FBBF24',
  bad: '#F87171',
};

/* =========================================================================
   COMPOSANTS GÉNÉRIQUES
   ========================================================================= */

const Logo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M50 65 Q 50 55, 30 30" stroke={COLORS.primary} strokeWidth="6" strokeLinecap="round" fill="none"/>
    <path d="M50 65 Q 50 55, 50 25" stroke={COLORS.primary} strokeWidth="6" strokeLinecap="round" fill="none"/>
    <path d="M50 65 Q 50 55, 70 35" stroke={COLORS.primary} strokeWidth="6" strokeLinecap="round" fill="none"/>
    <path d="M50 65 L 85 70" stroke={COLORS.primary} strokeWidth="6" strokeLinecap="round" fill="none"/>
  </svg>
);

const Sidebar = ({ active, setActive, onLogout }) => {
  const items = [
    { id: 'dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'portails', label: 'Portails', icon: Building2 },
    { id: 'sea', label: 'SEA', icon: Target },
    { id: 'crm', label: 'CRM', icon: Mail },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'analyse', label: 'Analyse IA', icon: Sparkles },
  ];
  return (
    <aside className="w-64 bg-black border-r flex flex-col" style={{ borderColor: COLORS.border }}>
      <div className="px-6 py-7 flex items-center gap-3 border-b" style={{ borderColor: COLORS.border }}>
        <Logo size={36} />
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', fontSize: 20 }}>
            ctoutvert
          </div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: COLORS.primary }}>
            Cockpit Saison 26
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: isActive ? 600 : 500,
                background: isActive ? `linear-gradient(90deg, ${COLORS.primary}22 0%, transparent 100%)` : 'transparent',
                color: isActive ? COLORS.primary : COLORS.text,
                borderLeft: isActive ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t text-xs" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COLORS.primary }} />
          Données depuis Notion
        </div>
        {SYNCED_AT && (
          <div className="mb-3">Sync : {new Date(SYNCED_AT).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md py-1.5 text-[11px] hover:bg-white/5 transition-colors"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontFamily: 'Manrope, sans-serif' }}
            title="Se déconnecter"
          >
            <LogOut size={11} />
            Déconnexion
          </button>
        )}
      </div>
    </aside>
  );
};

const Header = ({ pageTitle, pageSubtitle, month, setMonth }) => (
  <header className="px-6 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
    <div>
      <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
        {pageTitle}
      </h1>
      <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>{pageSubtitle}</p>
    </div>
    <div className="flex items-center gap-1 px-1 py-1 rounded-lg" style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}>
      <Calendar size={12} style={{ color: COLORS.primary, marginLeft: 6 }} />
      {MONTHS.map((m) => (
        <button
          key={m}
          onClick={() => setMonth(m)}
          className="px-2.5 py-1 rounded-md text-[11px] transition-all"
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: month === m ? 700 : 500,
            background: month === m ? COLORS.primary : 'transparent',
            color: month === m ? '#000' : COLORS.text,
          }}
        >
          {m === 'cumul' ? 'Cumul' : m.charAt(0).toUpperCase() + m.slice(1, 4)}
        </button>
      ))}
    </div>
  </header>
);

const Card = ({ children, className = '', style = {} }) => (
  <div className={'rounded-xl p-3 ' + className} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children, subtitle }) => (
  <div className="mb-4">
    <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
      {children}
    </h2>
    {subtitle && <p className="text-xs mt-1" style={{ color: COLORS.muted }}>{subtitle}</p>}
  </div>
);

const KPI = ({ label, value, evo: evoVal, subValue, hint, tone = 'default' }) => {
  const isUp = evoVal !== null && evoVal !== undefined && evoVal >= 0;
  const evoColor = evoVal === null || evoVal === undefined ? COLORS.muted : isUp ? COLORS.good : COLORS.bad;
  return (
    <Card>
      <div className="flex items-start justify-between mb-1">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, fontFamily: 'Manrope, sans-serif' }}>{label}</div>
        {evoVal !== null && evoVal !== undefined && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px]" style={{ background: evoColor + '22', color: evoColor }}>
            {isUp ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(evoVal*100).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: tone === 'primary' ? COLORS.primary : COLORS.text, lineHeight: 1.15 }}>
        {value}
      </div>
      {subValue && <div className="text-[11px] mt-0.5" style={{ color: COLORS.muted, fontFamily: 'JetBrains Mono, monospace' }}>{subValue}</div>}
      {hint && <div className="text-[10px] mt-1" style={{ color: COLORS.muted }}>{hint}</div>}
    </Card>
  );
};

const Insight = ({ kind = 'info', title, children }) => {
  const cfg = {
    success: { icon: CheckCircle2, color: COLORS.good, label: 'OPPORTUNITÉ' },
    warning: { icon: AlertTriangle, color: COLORS.warn, label: 'ALERTE' },
    danger: { icon: AlertCircle, color: COLORS.bad, label: 'RISQUE' },
    info: { icon: Lightbulb, color: COLORS.primary, label: 'INSIGHT' },
    action: { icon: Zap, color: COLORS.primary, label: 'ACTION' },
  }[kind];
  const Icon = cfg.icon;
  return (
    <Card style={{ borderLeft: `3px solid ${cfg.color}` }}>
      <div className="flex items-start gap-3">
        <Icon size={18} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] tracking-widest font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
            {title && <span className="text-sm font-semibold">{title}</span>}
          </div>
          <div className="text-sm" style={{ color: '#D4D4D4', lineHeight: 1.55 }}>{children}</div>
        </div>
      </div>
    </Card>
  );
};

const Modal = ({ open, onClose, title, subtitle, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl flex flex-col w-full"
        style={{
          background: '#1A1A1A',
          border: `1px solid ${COLORS.primary}66`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${COLORS.primary}22, 0 0 40px ${COLORS.primary}22`,
          maxWidth: 800,
          maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: COLORS.border, background: COLORS.primary + '0D' }}
        >
          <div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16 }}>{title}</h3>
            {subtitle && <p className="text-[11px] mt-0.5" style={{ color: COLORS.muted }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/10 transition-colors"
            style={{ color: COLORS.text }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

const ChartContainer = ({ title, subtitle, children, height }) => (
  <Card className="flex flex-col h-full">
    {title && (
      <div className="mb-2">
        <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>{title}</div>
        {subtitle && <div className="text-[11px]" style={{ color: COLORS.muted }}>{subtitle}</div>}
      </div>
    )}
    <div className="flex-1 min-h-0" style={{ width: '100%', height: height ?? undefined }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </Card>
);

const tooltipStyle = {
  contentStyle: {
    background: COLORS.surface2,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'JetBrains Mono, monospace',
    color: COLORS.text,
  },
  labelStyle: { color: COLORS.muted, fontSize: 11, marginBottom: 4 },
  cursor: { stroke: COLORS.primary, strokeOpacity: 0.3, strokeWidth: 1 },
};

const axisStyle = {
  tick: { fill: COLORS.muted, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
  axisLine: { stroke: COLORS.border },
  tickLine: { stroke: COLORS.border },
};

/* =========================================================================
   HELPERS DE LECTURE
   ========================================================================= */

const M_LIST = ['janvier', 'février', 'mars', 'avril'];

// Somme une clé sur les 4 mois — tolère les valeurs null
const sumMonths = (obj, key) =>
  M_LIST.reduce((s, m) => {
    const v = obj?.[m]?.[key];
    return s + (typeof v === 'number' ? v : 0);
  }, 0) || null;

const PORTAIL_LABELS = {
  CD: 'CampingDirect',
  C2B: 'Camping2Be',
  CSV: 'Camping Street View',
  IB: 'Ibericamp',
  AC: 'Alcampeggio',
  UC: 'Ucamping',
  MC: 'My Camping',
};

const PORTAIL_COLORS = {
  CD: '#22D3CC',
  UC: '#7FE6E0',
  C2B: '#FBBF24',
  CSV: '#A78BFA',
  IB: '#F472B6',
  AC: '#F87171',
  MC: '#FB923C',
};

/* =========================================================================
   PAGES
   ========================================================================= */

// === DASHBOARD ===
const DashboardPage = ({ month }) => {
  const isCumul = month === 'cumul';

  // Filtre portail : null = tous, sinon clé courte (CD, UC, ...).
  // Toggle au clic sur un portail dans la liste "Portail" en bas.
  const [selectedPortail, setSelectedPortail] = useState(null);

  // Comparaison M-1 : mois précédent dans la saison (null pour janvier ou cumul)
  const monthIdx = M_LIST.indexOf(month);
  const prevMonth = monthIdx > 0 ? M_LIST[monthIdx - 1] : null;
  const prevLabel = prevMonth ? prevMonth.charAt(0).toUpperCase() + prevMonth.slice(1, 4) : null;

  // Helpers : valeurs filtrées par mois et portail (le cas échéant)
  const getMonthValue = (m, key) => {
    if (selectedPortail) {
      // Pour trafic / clickouts : depuis PORTAILS. Les autres clés sont
      // globales et ne sont pas découpables par portail.
      if (key === 'trafic' || key === 'clickouts') {
        return PORTAILS[m]?.[selectedPortail]?.[key] ?? null;
      }
      return null;
    }
    return GLOBAL[m]?.[key] ?? null;
  };
  const getMonthValueN1 = (m, key) => {
    if (selectedPortail) {
      if (key === 'trafic') return PORTAILS[m]?.[selectedPortail]?.n1 ?? null;
      if (key === 'clickouts') return PORTAILS[m]?.[selectedPortail]?.n1Clickouts ?? null;
      return null;
    }
    return GLOBAL_N1[m]?.[key] ?? null;
  };

  const aggValue = (key) => {
    if (isCumul) {
      const sum = M_LIST.reduce((s, m) => {
        const v = getMonthValue(m, key);
        return s + (typeof v === 'number' ? v : 0);
      }, 0);
      return sum || null;
    }
    return getMonthValue(month, key);
  };

  const m1 = (key) => (prevMonth ? getMonthValue(prevMonth, key) : null);
  const hintM1 = (val) =>
    prevMonth
      ? `vs ${fmtFull(val)} en ${prevLabel}`
      : isCumul
        ? 'cumul Jan→Avril'
        : '—';

  const trafic = aggValue('trafic');
  const clickouts = aggValue('clickouts');
  // Réservations : non disponibles par portail dans Notion → null si filtre actif
  const resaDir = aggValue('resaDir');
  const resaApp = aggValue('resaApp');
  const totalResa = aggValue('totalResa');

  // Trends pour les charts (filtrées par portail si actif)
  const trendsData = M_LIST.map((m) => ({
    mois: m.charAt(0).toUpperCase() + m.slice(1, 4),
    trafic2026: getMonthValue(m, 'trafic'),
    trafic2025: getMonthValueN1(m, 'trafic'),
    clickouts2026: getMonthValue(m, 'clickouts'),
    clickouts2025: getMonthValueN1(m, 'clickouts'),
    // Réservations : toujours globales
    resaTotal2026: GLOBAL[m]?.totalResa ?? null,
    resaTotal2025: GLOBAL_N1[m]?.totalResa ?? null,
  }));

  // Mix canaux — toujours en cumul Jan→Avril, toujours global
  const canalKeys = ['SEO', 'SEA', 'DIRECT', 'REFERRAL', 'SOCIAL', 'IA', 'CRM'];
  const canauxData = canalKeys.map((k) => ({
    name: k,
    value: M_LIST.reduce((s, m) => s + (CANAUX[m]?.[k] ?? 0), 0),
  }));

  // Liste des portails — toujours en cumul Jan→Avril
  const portailsData = Object.keys(PORTAILS.janvier || {}).map((p) => ({
    portail: p,
    trafic: M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.trafic ?? 0), 0),
    n1: M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.n1 ?? 0), 0),
  }));

  const monthLabel = isCumul ? 'Cumul Jan→Avril 2026' : `${month.charAt(0).toUpperCase()}${month.slice(1)} 2026`;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Bloc filtrable par mois — visuellement isolé */}
      <section
        className="rounded-xl p-3 flex-shrink-0"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.primary}66`, boxShadow: `0 0 0 3px ${COLORS.primary}11` }}
      >
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={12} style={{ color: COLORS.primary }} />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.primary }}>
              Filtré par mois
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: COLORS.primary + '22', color: COLORS.primary, fontFamily: 'JetBrains Mono, monospace' }}>
              {monthLabel}
            </span>
            {selectedPortail && (
              <>
                <span className="text-[10px]" style={{ color: COLORS.muted }}>·</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#FB923C' }}>
                  Portail
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md inline-flex items-center gap-1" style={{ background: '#FB923C22', color: '#FB923C', fontFamily: 'JetBrains Mono, monospace' }}>
                  {PORTAIL_LABELS[selectedPortail]}
                  <button
                    onClick={() => setSelectedPortail(null)}
                    className="hover:bg-white/10 rounded p-0.5"
                    aria-label="Réinitialiser le filtre portail"
                    title="Retirer le filtre portail"
                  >
                    <X size={10} />
                  </button>
                </span>
              </>
            )}
          </div>
          <span className="text-[10px]" style={{ color: COLORS.muted }}>
            Comparaison M-1 · sélecteur en haut à droite
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <KPI label="Trafic" value={fmtFull(trafic)} evo={evo(trafic, m1('trafic'))} hint={hintM1(m1('trafic'))} tone="primary" />
          <KPI label="Clickouts" value={fmtFull(clickouts)} evo={evo(clickouts, m1('clickouts'))} hint={hintM1(m1('clickouts'))} />
          <KPI label="Réservations directes" value={selectedPortail ? '—' : fmtFull(resaDir)} evo={selectedPortail ? null : evo(resaDir, m1('resaDir'))} hint={selectedPortail ? 'non dispo / portail' : hintM1(m1('resaDir'))} />
          <KPI label="Réservations apporteurs" value={selectedPortail ? '—' : fmtFull(resaApp)} evo={selectedPortail ? null : evo(resaApp, m1('resaApp'))} hint={selectedPortail ? 'non dispo / portail' : hintM1(m1('resaApp'))} />
          <KPI label="Total réservations" value={selectedPortail ? '—' : fmtFull(totalResa)} evo={selectedPortail ? null : evo(totalResa, m1('totalResa'))} hint={selectedPortail ? 'non dispo / portail' : hintM1(m1('totalResa'))} tone="primary" />
        </div>
      </section>

      <div className="text-[10px] uppercase tracking-widest font-semibold flex-shrink-0" style={{ color: COLORS.muted }}>
        Vue saison · Cumul Janvier → Avril 2026
        {selectedPortail && <span style={{ color: '#FB923C', marginLeft: 8 }}>· trafic & clickouts filtrés sur {PORTAIL_LABELS[selectedPortail]}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <ChartContainer title={`Trafic mensuel — 2026 vs 2025${selectedPortail ? ` · ${PORTAIL_LABELS[selectedPortail]}` : ''}`}>
          <AreaChart data={trendsData}>
            <defs>
              <linearGradient id="grad26" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.5}/>
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="mois" {...axisStyle} />
            <YAxis {...axisStyle} tickFormatter={fmt} />
            <Tooltip {...tooltipStyle} formatter={(v) => fmtFull(v)} />
            <Area type="monotone" dataKey="trafic2025" stroke={COLORS.muted} strokeDasharray="4 4" fill="none" name="2025"/>
            <Area type="monotone" dataKey="trafic2026" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#grad26)" name="2026"/>
          </AreaChart>
        </ChartContainer>

        <ChartContainer title={`Clickouts mensuels — 2026 vs 2025${selectedPortail ? ` · ${PORTAIL_LABELS[selectedPortail]}` : ''}`}>
          <BarChart data={trendsData}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="mois" {...axisStyle} />
            <YAxis {...axisStyle} tickFormatter={fmt} />
            <Tooltip {...tooltipStyle} formatter={(v) => fmtFull(v)} />
            <Bar dataKey="clickouts2025" fill={COLORS.surface2} stroke={COLORS.muted} strokeDasharray="3 3" name="2025"/>
            <Bar dataKey="clickouts2026" fill={COLORS.primary} name="2026"/>
          </BarChart>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        <ChartContainer title="Réservations totales" subtitle={selectedPortail ? 'Données globales (non disponibles par portail)' : 'Direct + apporteurs'}>
          <ComposedChart data={trendsData}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="mois" {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="resaTotal2026" fill={COLORS.primary} radius={[4,4,0,0]} />
            <Line type="monotone" dataKey="resaTotal2025" stroke={COLORS.muted} strokeDasharray="4 4" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ChartContainer>

        <Card className="flex flex-col min-h-0">
          <div className="mb-2">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Mix canaux d'acquisition</div>
            {selectedPortail && (
              <div className="text-[10px]" style={{ color: COLORS.muted }}>Données globales — non disponibles par portail</div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
            {canauxData.sort((a, b) => b.value - a.value).map((c) => {
              const total = canauxData.reduce((s, x) => s + x.value, 0) || 1;
              const pct = c.value / total;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-[11px] mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ color: COLORS.text }}>{c.name}</span>
                    <span style={{ color: COLORS.muted }}>{fmtFull(c.value)} · {fmtPct(pct, 0)}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: COLORS.surface2 }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: COLORS.primary, opacity: 0.4 + pct * 1.5 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Portail</div>
            <span className="text-[9px]" style={{ color: COLORS.muted }}>cliquer pour filtrer</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
            {portailsData.sort((a, b) => (b.trafic ?? 0) - (a.trafic ?? 0)).map((p) => {
              const evoP = evo(p.trafic, p.n1);
              const isSelected = selectedPortail === p.portail;
              const isFictif = PORTAIL_ORIGINE[p.portail] === 'Fictif';
              return (
                <button
                  key={p.portail}
                  onClick={() => setSelectedPortail(isSelected ? null : p.portail)}
                  className="w-full flex items-center justify-between text-[11px] rounded-md px-2 py-1 transition-colors"
                  style={{
                    background: isSelected ? '#FB923C22' : 'transparent',
                    border: isSelected ? '1px solid #FB923C66' : '1px solid transparent',
                  }}
                  title={isSelected ? 'Cliquer pour retirer le filtre' : `Filtrer sur ${PORTAIL_LABELS[p.portail]}`}
                >
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isSelected ? 700 : 500, color: '#FB923C', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }} className="truncate">
                      {PORTAIL_LABELS[p.portail]}
                    </span>
                    {isFictif && <FictifDot />}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.text }}>{fmt(p.trafic)}</span>
                    {evoP !== null && (
                      <span className="px-1 py-0.5 rounded text-[9px]" style={{ background: (evoP >= 0 ? COLORS.good : COLORS.bad) + '22', color: evoP >= 0 ? COLORS.good : COLORS.bad, fontFamily: 'JetBrains Mono, monospace' }}>
                        {evoP >= 0 ? '+' : ''}{(evoP * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

// === PORTAILS ===
const PortailsPage = ({ month }) => {
  const isCumul = month === 'cumul';
  const monthIdx = M_LIST.indexOf(month);
  const prevMonth = monthIdx > 0 ? M_LIST[monthIdx - 1] : null;
  const prevLabel = prevMonth ? prevMonth.charAt(0).toUpperCase() + prevMonth.slice(1, 4) : null;
  const monthLabel = isCumul ? 'Cumul Jan→Avril 2026' : `${month.charAt(0).toUpperCase()}${month.slice(1)} 2026`;

  // Bloc filtrable : valeurs du mois + comparaison M-1
  const portailKeys = Object.keys(PORTAILS.janvier || {});
  const filteredCards = portailKeys.map((p) => {
    const trafic = isCumul
      ? M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.trafic ?? 0), 0)
      : PORTAILS[month]?.[p]?.trafic ?? null;
    const traficM1 = prevMonth ? PORTAILS[prevMonth]?.[p]?.trafic ?? null : null;
    return { portail: p, trafic, traficM1 };
  });

  // Données cumul (toujours Jan→Avril, indépendant du sélecteur)
  const cumulData = portailKeys.map((p) => ({
    portail: p,
    trafic: M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.trafic ?? 0), 0),
    n1: M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.n1 ?? 0), 0),
  }));

  const portailMonthly = M_LIST.map((m) => {
    const obj = { mois: m.charAt(0).toUpperCase() + m.slice(1, 4) };
    portailKeys.forEach((p) => {
      obj[PORTAIL_LABELS[p]] = PORTAILS[m]?.[p]?.trafic ?? null;
    });
    return obj;
  });

  const totalTrafic = cumulData.reduce((s, p) => s + (p.trafic ?? 0), 0);
  const totalN1 = cumulData.reduce((s, p) => s + (p.n1 ?? 0), 0);

  // État de la modale SEO
  const [seoModalPortail, setSeoModalPortail] = useState(null);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Bloc filtrable par mois */}
      <section
        className="rounded-xl p-3 flex-shrink-0"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.primary}66`, boxShadow: `0 0 0 3px ${COLORS.primary}11` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={12} style={{ color: COLORS.primary }} />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.primary }}>
              Filtré par mois
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: COLORS.primary + '22', color: COLORS.primary, fontFamily: 'JetBrains Mono, monospace' }}>
              {monthLabel}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: COLORS.muted }}>
            Comparaison M-1 · sélecteur en haut à droite
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {filteredCards.sort((a, b) => (b.trafic ?? 0) - (a.trafic ?? 0)).map((p) => {
            const evoP = evo(p.trafic, p.traficM1);
            const isFictif = PORTAIL_ORIGINE[p.portail] === 'Fictif';
            return (
              <Card key={p.portail} style={isFictif ? { borderColor: COLORS.warn + '66' } : {}}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[9px] uppercase tracking-wider truncate" style={{ color: COLORS.muted }}>{PORTAIL_LABELS[p.portail]}</div>
                  {isFictif && <FictifDot />}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{fmtFull(p.trafic)}</div>
                {evoP !== null && (
                  <div className="mt-1 inline-flex items-center gap-1 px-1 py-0.5 rounded text-[10px]" style={{ background: (evoP >= 0 ? COLORS.good : COLORS.bad) + '22', color: evoP >= 0 ? COLORS.good : COLORS.bad }}>
                    {evoP >= 0 ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(evoP * 100).toFixed(0)}%</span>
                  </div>
                )}
                <div className="text-[9px] mt-0.5" style={{ color: COLORS.muted }}>
                  {prevMonth ? `vs ${fmt(p.traficM1)} en ${prevLabel}` : isCumul ? 'cumul' : '—'}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="text-[10px] uppercase tracking-widest font-semibold flex-shrink-0" style={{ color: COLORS.muted }}>
        Vue saison · Cumul Janvier → Avril 2026
      </div>

      {/* Charts cumul */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        <div className="col-span-2 min-h-0">
          <ChartContainer title="Trafic par portail — évolution mensuelle">
            <LineChart data={portailMonthly}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="mois" {...axisStyle} />
              <YAxis {...axisStyle} tickFormatter={fmt} />
              <Tooltip {...tooltipStyle} formatter={(v) => fmtFull(v)} />
              <Line type="monotone" dataKey="CampingDirect" stroke={COLORS.primary} strokeWidth={2.5} dot={{r:3}} />
              <Line type="monotone" dataKey="Ucamping" stroke="#7FE6E0" strokeWidth={2} dot={{r:3}} />
              <Line type="monotone" dataKey="Camping2Be" stroke="#FBBF24" strokeWidth={2} dot={{r:3}} />
              <Line type="monotone" dataKey="Camping Street View" stroke="#A78BFA" strokeWidth={2} dot={{r:3}} />
              <Line type="monotone" dataKey="Ibericamp" stroke="#F472B6" strokeWidth={2} dot={{r:3}} />
              <Line type="monotone" dataKey="Alcampeggio" stroke="#F87171" strokeWidth={2} dot={{r:3}} />
              <Line type="monotone" dataKey="My Camping" stroke="#FB923C" strokeWidth={2} strokeDasharray="4 3" dot={{r:3}} />
            </LineChart>
          </ChartContainer>
        </div>
        <ChartContainer title="Évolution vs N-1" subtitle="Cumul Jan→Avr">
          <BarChart
            data={cumulData
              .map((p) => ({ ...p, label: PORTAIL_LABELS[p.portail], evo: evo(p.trafic, p.n1) ? evo(p.trafic, p.n1) * 100 : 0 }))
              .sort((a, b) => b.evo - a.evo)}
            layout="vertical"
            margin={{ left: 70 }}
          >
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis type="number" {...axisStyle} tickFormatter={(v) => v + '%'} />
            <YAxis dataKey="label" type="category" {...axisStyle} width={70}/>
            <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(1) + '%'} />
            <Bar dataKey="evo" radius={[0, 4, 4, 0]}>
              {cumulData.map((p, i) => <Cell key={i} fill={(evo(p.trafic, p.n1) ?? 0) >= 0 ? COLORS.good : COLORS.bad} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Tableau cumul avec icône oeil */}
      <Card className="flex flex-col flex-shrink-0" style={{ maxHeight: '38%' }}>
        <div className="text-sm font-semibold mb-2 flex-shrink-0" style={{ fontFamily: 'Manrope, sans-serif' }}>Détail par portail — cumul Jan→Avril</div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background: COLORS.surface }}>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="text-left py-1.5 font-semibold">Portail</th>
                <th className="text-right py-1.5 font-semibold">Trafic 2026</th>
                <th className="text-right py-1.5 font-semibold">Trafic 2025</th>
                <th className="text-right py-1.5 font-semibold">Évo N-1</th>
                <th className="text-right py-1.5 font-semibold">Part du total</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {cumulData.sort((a, b) => (b.trafic ?? 0) - (a.trafic ?? 0)).map((p) => {
                const evoP = evo(p.trafic, p.n1);
                return (
                  <tr key={p.portail} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td className="py-1.5" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                      <span className="inline-flex items-center gap-2">
                        {PORTAIL_LABELS[p.portail]}
                        {PORTAIL_ORIGINE[p.portail] === 'Fictif' && <FictifBadge />}
                        <button
                          onClick={() => setSeoModalPortail(p.portail)}
                          className="rounded p-0.5 hover:bg-white/10 transition-colors"
                          style={{ color: '#FB923C' }}
                          aria-label={`Voir performance ${p.portail === 'MC' ? 'GEO' : 'SEO'} de ${PORTAIL_LABELS[p.portail]}`}
                          title={`Voir performance ${p.portail === 'MC' ? 'GEO' : 'SEO'}`}
                        >
                          <Eye size={14} strokeWidth={2.2} />
                        </button>
                      </span>
                    </td>
                    <td className="text-right py-1.5">{fmtFull(p.trafic)}</td>
                    <td className="text-right py-1.5" style={{ color: COLORS.muted }}>{fmtFull(p.n1)}</td>
                    <td className="text-right py-1.5" style={{ color: evoP === null ? COLORS.muted : evoP >= 0 ? COLORS.good : COLORS.bad }}>
                      {evoP === null ? '—' : `${evoP >= 0 ? '+' : ''}${(evoP * 100).toFixed(1)}%`}
                    </td>
                    <td className="text-right py-1.5" style={{ color: COLORS.muted }}>{fmtPct((p.trafic ?? 0) / (totalTrafic || 1), 1)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: COLORS.surface2 }}>
                <td className="py-1.5 font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>TOTAL</td>
                <td className="text-right py-1.5 font-bold">{fmtFull(totalTrafic)}</td>
                <td className="text-right py-1.5" style={{ color: COLORS.muted }}>{fmtFull(totalN1)}</td>
                <td className="text-right py-1.5 font-bold" style={{ color: evo(totalTrafic, totalN1) >= 0 ? COLORS.good : COLORS.bad }}>
                  {evo(totalTrafic, totalN1) === null ? '—' : (evo(totalTrafic, totalN1) * 100).toFixed(1) + '%'}
                </td>
                <td className="text-right py-1.5">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <SEOPortailModal
        portail={seoModalPortail}
        onClose={() => setSeoModalPortail(null)}
      />
    </div>
  );
};

// Badge "Fictif" — pour signaler les données estimées
const FictifBadge = () => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
    style={{ background: COLORS.warn + '22', color: COLORS.warn, border: `1px solid ${COLORS.warn}55` }}
    title="Donnée fictive — répartition estimée, à remplacer par les vraies valeurs"
  >
    ⚠ Fictif
  </span>
);

// Variante compacte pour les espaces très étroits (cartes KPI)
const FictifDot = () => (
  <span
    className="inline-flex items-center justify-center rounded-full text-[8px] font-bold uppercase"
    style={{ background: COLORS.warn + '22', color: COLORS.warn, border: `1px solid ${COLORS.warn}55`, width: 14, height: 14, lineHeight: 1 }}
    title="Donnée fictive"
  >
    ⚠
  </span>
);

// Modale SEO/GEO ouverte depuis la page Portails
const SEOPortailModal = ({ portail, onClose }) => {
  if (!portail) return <Modal open={false} onClose={onClose} />;

  const perPortail = SEO_PER_PORTAIL[portail];
  const monthly = perPortail?.monthly ?? {};
  const isFictif = perPortail?.origine === 'Fictif';
  // Convention : My Camping est positionné comme un produit GEO, pas SEO.
  const label = portail === 'MC' ? 'GEO' : 'SEO';

  const trafic = M_LIST.reduce((s, m) => s + (monthly[m]?.trafic ?? 0), 0);
  const traficN1 = M_LIST.reduce((s, m) => s + (monthly[m]?.n1Trafic ?? 0), 0);
  const clickouts = M_LIST.reduce((s, m) => s + (monthly[m]?.clickouts ?? 0), 0);
  const clickoutsN1 = M_LIST.reduce((s, m) => s + (monthly[m]?.n1Clickouts ?? 0), 0);

  const trends = M_LIST.map((m) => ({
    mois: m.charAt(0).toUpperCase() + m.slice(1, 4),
    trafic2026: monthly[m]?.trafic ?? null,
    trafic2025: monthly[m]?.n1Trafic ?? null,
  }));

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          Performance {label} — {PORTAIL_LABELS[portail]}
          {isFictif && <FictifBadge />}
        </span>
      }
      subtitle={
        isFictif
          ? `Trafic et clickouts mensuels : données fictives. ${label === 'GEO' ? 'Performance ciblage géographique pour ce nouveau portail.' : 'Répartition estimée 80/8/5/3/3/1 % entre CD/UC/C2B/CSV/IB/AC.'} Marchés linguistiques : agrégat global tous portails.`
          : 'Trafic et clickouts mensuels par portail. Marchés linguistiques : agrégat global tous portails.'
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KPI label={`Trafic ${label} cumul`} value={fmtFull(trafic)} evo={evo(trafic, traficN1)} hint={`vs ${fmtFull(traficN1)} n-1`} tone="primary" />
        <KPI label={`Clickouts ${label} cumul`} value={fmtFull(clickouts)} evo={evo(clickouts, clickoutsN1)} hint={`vs ${fmtFull(clickoutsN1)} n-1`} />
      </div>

      <Card className="mb-4">
        <div className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Trafic {label} — 2026 vs 2025
          {isFictif && <FictifBadge />}
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="seoModalG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="mois" {...axisStyle} />
              <YAxis {...axisStyle} tickFormatter={fmt} />
              <Tooltip {...tooltipStyle} formatter={(v) => fmtFull(v)} />
              <Area type="monotone" dataKey="trafic2025" stroke={COLORS.muted} strokeDasharray="4 4" fill="none" name="2025" />
              <Area type="monotone" dataKey="trafic2026" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#seoModalG)" name="2026"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Performance SEO par marché linguistique — snapshot Avril 2026 <span className="text-[10px] font-normal" style={{ color: COLORS.muted }}>· agrégat tous portails</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
              <th className="text-left py-1.5">Marché</th>
              <th className="text-right py-1.5">Mots-clés</th>
              <th className="text-right py-1.5">Top 3</th>
              <th className="text-right py-1.5">Top 4-10</th>
              <th className="text-right py-1.5">% Page 1</th>
              <th className="text-right py-1.5">Non classé</th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {SEO_MARCHES.map((m) => {
              const pctP1 = m.kw ? (m.top3 + m.top4_10) / m.kw : null;
              return (
                <tr key={m.marche} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="py-1.5" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>{m.marche}</td>
                  <td className="text-right py-1.5">{fmtFull(m.kw)}</td>
                  <td className="text-right py-1.5" style={{ color: COLORS.good }}>{fmtFull(m.top3)}</td>
                  <td className="text-right py-1.5">{fmtFull(m.top4_10)}</td>
                  <td className="text-right py-1.5" style={{ color: pctP1 == null ? COLORS.muted : pctP1 >= 0.5 ? COLORS.good : pctP1 >= 0.3 ? COLORS.warn : COLORS.bad }}>
                    {fmtPct(pctP1, 0)}
                  </td>
                  <td className="text-right py-1.5" style={{ color: COLORS.muted }}>{fmtFull(m.nonClasse)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Modal>
  );
};

// === SEA ===
const SEAPage = ({ month }) => {
  const isCumul = month === 'cumul';
  const monthIdx = M_LIST.indexOf(month);
  const prevMonth = monthIdx > 0 ? M_LIST[monthIdx - 1] : null;
  const prevLabel = prevMonth ? prevMonth.charAt(0).toUpperCase() + prevMonth.slice(1, 4) : null;
  const monthLabel = isCumul ? 'Cumul Jan→Avril 2026' : `${month.charAt(0).toUpperCase()}${month.slice(1)} 2026`;

  // Bloc filtrable : valeurs du mois sélectionné + comparaison M-1
  const get = (key) => (isCumul ? sumMonths(SEA_PERF, key) : SEA_PERF[month]?.[key] ?? null);
  const m1 = (key) => (prevMonth ? SEA_PERF[prevMonth]?.[key] ?? null : null);
  const hintM1 = (val, suffix = '') =>
    prevMonth
      ? `vs ${suffix === '€' ? fmtEuro(val) : fmtFull(val)} en ${prevLabel}`
      : isCumul
        ? 'cumul Jan→Avril'
        : '—';

  const trafic = get('trafic');
  const clickouts = get('clickouts');
  const budget = get('budget');
  const txConv = clickouts && trafic ? clickouts / trafic : null;
  const coutCO = clickouts && budget ? budget / clickouts : null;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Bloc filtrable par mois */}
      <section
        className="rounded-xl p-3 flex-shrink-0"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.primary}66`, boxShadow: `0 0 0 3px ${COLORS.primary}11` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={12} style={{ color: COLORS.primary }} />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.primary }}>
              Filtré par mois
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: COLORS.primary + '22', color: COLORS.primary, fontFamily: 'JetBrains Mono, monospace' }}>
              {monthLabel}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: COLORS.muted }}>
            Comparaison M-1 · sélecteur en haut à droite
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <KPI label="Trafic SEA" value={fmtFull(trafic)} evo={evo(trafic, m1('trafic'))} hint={hintM1(m1('trafic'))} tone="primary" />
          <KPI label="Clickouts SEA" value={fmtFull(clickouts)} evo={evo(clickouts, m1('clickouts'))} hint={hintM1(m1('clickouts'))} />
          <KPI label="Tx conv. clickout" value={fmtPct(txConv, 1)} hint="trafic → clickout" />
          <KPI label="Budget consommé" value={fmtEuro(budget)} evo={evo(budget, m1('budget'))} hint={hintM1(m1('budget'), '€')} />
          <KPI label="Coût / clickout" value={fmtEuro(coutCO)} hint="budget / clickouts" tone="primary" />
        </div>
      </section>

      <div className="text-[10px] uppercase tracking-widest font-semibold flex-shrink-0" style={{ color: COLORS.muted }}>
        Campagnes SEA en cours
        <span className="ml-2" style={{ color: COLORS.warn, fontWeight: 700 }}>⚠ Fictif</span>
      </div>

      {/* Tableau campagnes pleine largeur */}
      <div className="flex-1 min-h-0">
        <Card className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Listing campagnes — {SEA_CAMPAGNES.length} actives ce mois
            </div>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: COLORS.muted }}>
              <span>Budget total : <strong style={{ color: COLORS.text, fontFamily: 'JetBrains Mono, monospace' }}>{fmtEuro(SEA_CAMPAGNES.reduce((s, c) => s + c.budgetMensuel, 0))}</strong></span>
              <span>·</span>
              <span>Dépensé : <strong style={{ color: COLORS.primary, fontFamily: 'JetBrains Mono, monospace' }}>{fmtEuro(SEA_CAMPAGNES.reduce((s, c) => s + c.depense, 0))}</strong></span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background: COLORS.surface }}>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th className="text-left py-1.5 pr-2">Campagne</th>
                  <th className="text-left py-1.5 pr-2">Pays</th>
                  <th className="text-right py-1.5 pr-2">Budget</th>
                  <th className="text-right py-1.5 pr-2">Dépensé</th>
                  <th className="text-right py-1.5 pr-2">Clics</th>
                  <th className="text-right py-1.5 pr-2">CTR</th>
                  <th className="text-right py-1.5 pr-2">Conv.</th>
                  <th className="text-right py-1.5">Coût / Conv.</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {[...SEA_CAMPAGNES].sort((a, b) => b.depense - a.depense).map((c) => {
                  const pctConsomme = c.budgetMensuel ? c.depense / c.budgetMensuel : 0;
                  const ctr = c.impressions ? c.clics / c.impressions : null;
                  const coutConv = c.conversions ? c.depense / c.conversions : null;
                  const isPause = c.statut === 'Pause';
                  const typeColor = SEA_TYPE_COLORS[c.type] ?? COLORS.muted;
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}`, opacity: isPause ? 0.55 : 1 }}>
                      <td className="py-1.5 pr-2" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                        <span className="inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: typeColor }} />
                          <span className="truncate">{c.nom}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ background: typeColor + '22', color: typeColor, fontFamily: 'JetBrains Mono, monospace' }}>
                            {c.type}
                          </span>
                          {isPause && (
                            <span className="text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ background: COLORS.muted + '22', color: COLORS.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                              ⏸ Pause
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2" style={{ color: COLORS.muted }}>{c.pays}</td>
                      <td className="text-right py-1.5 pr-2">{fmtEuro(c.budgetMensuel)}</td>
                      <td className="text-right py-1.5 pr-2">
                        <span style={{ color: pctConsomme >= 0.95 ? COLORS.warn : COLORS.text }}>
                          {fmtEuro(c.depense)}
                        </span>
                        <span className="text-[9px] ml-1" style={{ color: COLORS.muted }}>
                          ({fmtPct(pctConsomme, 0)})
                        </span>
                      </td>
                      <td className="text-right py-1.5 pr-2">{fmtFull(c.clics)}</td>
                      <td className="text-right py-1.5 pr-2" style={{ color: ctr == null ? COLORS.muted : ctr >= 0.10 ? COLORS.good : ctr >= 0.05 ? COLORS.text : COLORS.warn }}>
                        {fmtPct(ctr, 1)}
                      </td>
                      <td className="text-right py-1.5 pr-2 font-bold" style={{ color: COLORS.primary }}>{fmtFull(c.conversions)}</td>
                      <td className="text-right py-1.5" style={{ color: COLORS.muted }}>
                        {coutConv == null ? '—' : fmtEuro(Math.round(coutConv))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
};

// === CRM ===

// Calendrier mensuel des campagnes CRM 2026 (donnée fictive).
const FRENCH_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const FRENCH_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatDateFr = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d, 10)} ${FRENCH_MONTHS[parseInt(m, 10) - 1].slice(0, 3).toLowerCase()}.`;
};

const CampagneTooltip = ({ campagnes, anchor }) => {
  if (!campagnes?.length || !anchor) return null;
  const hasResults = campagnes.some((c) => c.resultats);
  const tooltipWidth = hasResults ? 480 : 280;

  // Placement intelligent : sous l'ancrage par défaut, au-dessus si manque de place
  const estimatedHeight = hasResults ? 420 : 200;
  const spaceBelow = window.innerHeight - anchor.bottom;
  const placeAbove = spaceBelow < estimatedHeight && anchor.top > estimatedHeight;
  const top = placeAbove ? anchor.top - 8 : anchor.bottom + 6;
  const left = Math.min(
    Math.max(anchor.left + anchor.width / 2 - tooltipWidth / 2, 8),
    window.innerWidth - tooltipWidth - 8,
  );

  return createPortal(
    <div
      className="fixed z-[60] rounded-lg p-3 pointer-events-none"
      style={{
        background: '#1A1A1A',
        border: `1px solid ${COLORS.primary}66`,
        boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 30px ${COLORS.primary}22`,
        top,
        left,
        width: tooltipWidth,
        maxHeight: '80vh',
        overflowY: 'auto',
        transform: placeAbove ? 'translateY(-100%)' : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: COLORS.warn }}>⚠ Fictif</span>
        <span className="text-[10px]" style={{ color: COLORS.muted }}>
          {campagnes.length} campagne{campagnes.length > 1 ? 's' : ''}
        </span>
      </div>
      {campagnes.map((c, i) => (
        <div key={c.id} className={i > 0 ? 'mt-3 pt-3 border-t' : ''} style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-semibold text-[13px]" style={{ color: c.color, fontFamily: 'Manrope, sans-serif' }}>
              {c.nom}
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: c.color + '22', color: c.color, fontFamily: 'JetBrains Mono, monospace' }}>
              {c.type}
            </span>
          </div>

          {/* Détails */}
          <div className="grid gap-y-1 text-[10px] mb-2" style={{ gridTemplateColumns: '70px 1fr' }}>
            <div style={{ color: COLORS.muted }}>Date</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatDateFr(c.date)}</div>
            <div style={{ color: COLORS.muted }}>Audience</div>
            <div>{c.audience}</div>
            <div style={{ color: COLORS.muted }}>Objectif</div>
            <div>{c.objectif}</div>
          </div>

          {/* Résultats (campagnes passées uniquement) */}
          {c.resultats && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
              <div className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: COLORS.primary }}>
                Résultats
              </div>

              {/* KPIs principaux */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                <div className="rounded p-1.5" style={{ background: COLORS.surface2 }}>
                  <div className="text-[9px]" style={{ color: COLORS.muted }}>Envois</div>
                  <div className="text-[12px] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtFull(c.resultats.envois)}</div>
                </div>
                <div className="rounded p-1.5" style={{ background: COLORS.surface2 }}>
                  <div className="text-[9px]" style={{ color: COLORS.muted }}>Tx ouv.</div>
                  <div className="text-[12px] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.primary }}>{fmtPct(c.resultats.txOuverture, 1)}</div>
                </div>
                <div className="rounded p-1.5" style={{ background: COLORS.surface2 }}>
                  <div className="text-[9px]" style={{ color: COLORS.muted }}>Tx clic</div>
                  <div className="text-[12px] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.warn }}>{fmtPct(c.resultats.txClic, 1)}</div>
                </div>
                <div className="rounded p-1.5" style={{ background: COLORS.surface2 }}>
                  <div className="text-[9px]" style={{ color: COLORS.muted }}>Conversions</div>
                  <div className="text-[12px] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.good }}>{fmtFull(c.resultats.conversions)}</div>
                </div>
              </div>

              {/* Détails secondaires */}
              <div className="grid grid-cols-3 gap-1.5 mb-2 text-[9px]">
                <div>
                  <span style={{ color: COLORS.muted }}>Délivrés : </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtFull(c.resultats.delivres)}</span>
                  <span style={{ color: COLORS.muted }}> ({fmtPct(c.resultats.txDelivrabilite, 1)})</span>
                </div>
                <div>
                  <span style={{ color: COLORS.muted }}>Ouvertures : </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtFull(c.resultats.ouvertures)}</span>
                </div>
                <div>
                  <span style={{ color: COLORS.muted }}>Désabos : </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtFull(c.resultats.desabos)}</span>
                  <span style={{ color: COLORS.muted }}> ({fmtPct(c.resultats.txDesab, 2)})</span>
                </div>
              </div>

              {/* Performance par langue */}
              <div className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: COLORS.muted }}>
                Performance par langue
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                    <th className="text-left py-1 font-medium">Langue</th>
                    <th className="text-right py-1 font-medium">Envois</th>
                    <th className="text-right py-1 font-medium">Tx ouv.</th>
                    <th className="text-right py-1 font-medium">Tx clic</th>
                  </tr>
                </thead>
                <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {c.resultats.parLangue.map((l) => (
                    <tr key={l.langue} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td className="py-1" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>{l.langue}</td>
                      <td className="text-right py-1">{fmtFull(l.envoi)}</td>
                      <td className="text-right py-1" style={{ color: l.txOuv >= 0.25 ? COLORS.good : l.txOuv >= 0.15 ? COLORS.text : COLORS.bad }}>
                        {fmtPct(l.txOuv, 1)}
                      </td>
                      <td className="text-right py-1" style={{ color: l.txClic >= 0.05 ? COLORS.good : l.txClic >= 0.02 ? COLORS.text : COLORS.bad }}>
                        {fmtPct(l.txClic, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
};

const CRMCalendar = ({ campagnes }) => {
  // Mois courant par défaut (avril 2026, début saison)
  const [{ year, month }, setYM] = useState({ year: 2026, month: 3 });
  const [tooltip, setTooltip] = useState(null);

  const goPrev = () => setYM(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }));
  const goNext = () => setYM(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }));

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let firstWeekday = firstDay.getDay() - 1;
  if (firstWeekday < 0) firstWeekday = 6;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dateOf = (d) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const campagnesForDay = (d) => {
    if (!d) return [];
    const dateStr = dateOf(d);
    return campagnes.filter((c) => c.date === dateStr);
  };

  const today = new Date().toISOString().split('T')[0];

  const handleEnter = (e, camps) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ campagnes: camps, anchor: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width } });
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-semibold whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Planning campagnes CRM
          </div>
          <FictifBadge />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={goPrev}
            className="rounded-md p-1 hover:bg-white/10 transition-colors"
            style={{ color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            aria-label="Mois précédent"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] px-2 min-w-[110px] text-center" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.primary }}>
            {FRENCH_MONTHS[month]} {year}
          </span>
          <button
            onClick={goNext}
            className="rounded-md p-1 hover:bg-white/10 transition-colors"
            style={{ color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            aria-label="Mois suivant"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[9px] uppercase tracking-wider text-center mb-1 flex-shrink-0" style={{ color: COLORS.muted }}>
        {FRENCH_DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0" style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(0, 1fr))` }}>
        {cells.map((d, i) => {
          if (!d) {
            return <div key={i} className="rounded-md" style={{ background: COLORS.bg, opacity: 0.3 }} />;
          }
          const camps = campagnesForDay(d);
          const dateStr = dateOf(d);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const hasCamp = camps.length > 0;

          return (
            <div
              key={i}
              className="relative rounded-md p-1 flex flex-col text-[10px]"
              style={{
                background: hasCamp ? COLORS.surface2 : '#0E0E0E',
                border: isToday ? `1.5px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                opacity: isPast && !hasCamp ? 0.5 : 1,
                cursor: hasCamp ? 'pointer' : 'default',
                minWidth: 0,
              }}
              onMouseEnter={hasCamp ? (e) => handleEnter(e, camps) : undefined}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="flex items-center justify-between flex-shrink-0">
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: isToday ? COLORS.primary : COLORS.muted, fontWeight: isToday ? 700 : 400 }}>
                  {d}
                </span>
                {camps.length > 1 && (
                  <span className="text-[8px] px-1 rounded" style={{ background: COLORS.warn + '22', color: COLORS.warn, fontFamily: 'JetBrains Mono, monospace' }}>
                    {camps.length}
                  </span>
                )}
              </div>
              {hasCamp && (
                <div className="mt-auto space-y-0.5 overflow-hidden">
                  {camps.slice(0, 2).map((c) => (
                    <div
                      key={c.id}
                      className="rounded px-1 truncate text-[9px] font-medium"
                      style={{ background: c.color + '33', color: c.color, lineHeight: 1.3 }}
                      title={c.nom}
                    >
                      {c.nom}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tooltip && <CampagneTooltip campagnes={tooltip.campagnes} anchor={tooltip.anchor} />}
    </Card>
  );
};

const CRMPage = ({ month }) => {
  const m = month === 'cumul' ? 'avril' : month;
  const data = CRM_BASE[m];
  const nl = CRM_NL[m];

  const trends = M_LIST.map((mm) => ({
    mois: mm.charAt(0).toUpperCase() + mm.slice(1, 4),
    base: CRM_BASE[mm]?.positionnes ?? null,
    nouveaux: CRM_BASE[mm]?.nouveaux ?? null,
    desabos: -(CRM_BASE[mm]?.desabos ?? 0),
    txOuv: CRM_NL[mm]?.ouverture != null ? CRM_NL[mm].ouverture * 100 : null,
    txClic: CRM_NL[mm]?.clic != null ? CRM_NL[mm].clic * 100 : null,
  }));

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2 flex-shrink-0">
        <KPI label="Base totale" value={fmtFull(data?.total)} hint="contacts toutes langues" tone="primary"/>
        <KPI label="Base positionnée" value={fmtFull(data?.positionnes)} hint={data?.total ? `${fmtPct((data.positionnes ?? 0)/data.total, 0)} actifs` : ''} />
        <KPI label="Net growth (mois)" value={data?.netGrowth != null ? `${data.netGrowth >= 0 ? '+' : ''}${fmtFull(data.netGrowth)}` : '—'} hint={`${fmtFull(data?.nouveaux)} new · -${fmtFull(data?.desabos)} déab.`} />
        <KPI label="Tx ouverture NL" value={nl ? fmtPct(nl.ouverture, 1) : '—'} hint={nl ? 'moyenne mensuelle' : 'Pas de NL'} tone="primary" />
        <KPI label="Tx clic NL" value={nl ? fmtPct(nl.clic, 2) : '—'} hint="CTR mensuel" />
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <CRMCalendar campagnes={CRM_CAMPAGNES} />

        <ChartContainer title="Performance newsletters" subtitle="Tx ouverture et clic mensuels">
          <ComposedChart data={trends}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="mois" {...axisStyle} />
            <YAxis yAxisId="left" {...axisStyle} tickFormatter={(v) => v.toFixed(0) + '%'} />
            <YAxis yAxisId="right" orientation="right" {...axisStyle} tickFormatter={(v) => v.toFixed(1) + '%'} />
            <Tooltip {...tooltipStyle} formatter={(v) => (v == null ? '—' : v.toFixed(2) + '%')} />
            <Bar yAxisId="left" dataKey="txOuv" fill={COLORS.primary} name="Tx ouverture" />
            <Line yAxisId="right" type="monotone" dataKey="txClic" stroke={COLORS.warn} strokeWidth={2.5} name="Tx clic" dot={{r:4}} />
          </ComposedChart>
        </ChartContainer>
      </div>

      <Card className="flex flex-col flex-shrink-0" style={{ maxHeight: '38%' }}>
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Top 5 campagnes — par conversions</div>
          <FictifBadge />
          <span className="text-[10px]" style={{ color: COLORS.muted }}>· campagnes passées uniquement</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background: COLORS.surface }}>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="text-left py-1.5 w-6">#</th>
                <th className="text-left py-1.5">Campagne</th>
                <th className="text-left py-1.5">Date</th>
                <th className="text-right py-1.5">Envois</th>
                <th className="text-right py-1.5">Délivrabilité</th>
                <th className="text-right py-1.5">Tx ouv.</th>
                <th className="text-right py-1.5">Tx clic</th>
                <th className="text-right py-1.5">Conversions</th>
                <th className="text-right py-1.5">Tx conv.</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {[...CRM_CAMPAGNES]
                .filter((c) => c.resultats)
                .sort((a, b) => (b.resultats.conversions ?? 0) - (a.resultats.conversions ?? 0))
                .slice(0, 5)
                .map((c, i) => {
                  const r = c.resultats;
                  const txConv = r.envois ? r.conversions / r.envois : null;
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td className="py-1.5 font-bold" style={{ color: i === 0 ? COLORS.warn : i === 1 ? COLORS.primaryLight : i === 2 ? COLORS.muted : COLORS.muted }}>
                        {i + 1}
                      </td>
                      <td className="py-1.5" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                        <span className="inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                          {c.nom}
                          <span className="text-[9px] px-1 py-0.5 rounded flex-shrink-0" style={{ background: c.color + '22', color: c.color, fontFamily: 'JetBrains Mono, monospace' }}>
                            {c.type}
                          </span>
                        </span>
                      </td>
                      <td className="py-1.5" style={{ color: COLORS.muted }}>{formatDateFr(c.date)}</td>
                      <td className="text-right py-1.5">{fmtFull(r.envois)}</td>
                      <td className="text-right py-1.5" style={{ color: COLORS.muted }}>{fmtPct(r.txDelivrabilite, 1)}</td>
                      <td className="text-right py-1.5" style={{ color: r.txOuverture >= 0.25 ? COLORS.good : r.txOuverture >= 0.15 ? COLORS.text : COLORS.bad }}>
                        {fmtPct(r.txOuverture, 1)}
                      </td>
                      <td className="text-right py-1.5" style={{ color: r.txClic >= 0.07 ? COLORS.good : r.txClic >= 0.04 ? COLORS.text : COLORS.bad }}>
                        {fmtPct(r.txClic, 1)}
                      </td>
                      <td className="text-right py-1.5 font-bold" style={{ color: COLORS.primary }}>{fmtFull(r.conversions)}</td>
                      <td className="text-right py-1.5" style={{ color: COLORS.muted }}>{fmtPct(txConv, 2)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// === PERFORMANCE ===
// ROI marketing : Budget vs CA réservations, par mois et par levier.
// Note : la budget Notion couvre Oct→Mars (6 mois), le CA disponible couvre
// Jan→Avr (4 mois). Le ROI mensuel s'appuie sur un budget mensuel moyen
// (budget cumul / 6) pour rester comparable.
const LEVIER_TO_CANAL = { SEO: 'SEO', SEA: 'SEA', Direct: 'DIRECT', IA: 'IA', RS: 'SOCIAL', CRM: 'CRM' };

const PerformancePage = ({ month }) => {
  const isCumul = month === 'cumul';

  // Budget cumul Oct→Mars 2026 (réel & N-1)
  const budgetTotal = BUDGET_LEVIERS.reduce((s, l) => s + (l.budget ?? 0), 0);
  const budgetTotalN1 = BUDGET_LEVIERS.reduce((s, l) => s + (l.n1 ?? 0), 0);
  const budgetMensuelMoyen = budgetTotal / 6; // cumul = 6 mois (Oct→Mars)

  // CA & réservations Jan→Avr 2026
  const caYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.ca ?? 0), 0);
  const resaYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.totalResa ?? 0), 0);
  const roiYTD = budgetTotal ? caYTD / budgetTotal : null;
  const cpa = resaYTD ? budgetTotal / resaYTD : null; // coût d'acquisition / résa
  const ticketMoyen = resaYTD ? caYTD / resaYTD : null;

  // ROI du mois sélectionné (ou cumul)
  const caMois = isCumul ? caYTD : (GLOBAL[month]?.ca ?? null);
  const budgetMois = isCumul ? budgetTotal * (M_LIST.length / 6) : budgetMensuelMoyen;
  const roiMois = caMois && budgetMois ? caMois / budgetMois : null;

  // Évolution mensuelle du ROI
  const roiMensuel = M_LIST.map((m) => ({
    mois: m.charAt(0).toUpperCase() + m.slice(1, 4),
    ca: GLOBAL[m]?.ca ?? 0,
    budget: budgetMensuelMoyen,
    roi: GLOBAL[m]?.ca ? GLOBAL[m].ca / budgetMensuelMoyen : 0,
  }));

  // Allocation par levier (basée sur la part de trafic Jan→Mars puisque
  // CANAUX n'a pas avril). On extrapole CA Jan→Mars proportionnellement.
  const moisAttribution = ['janvier', 'février', 'mars'];
  const traficByCanal = {};
  Object.values(LEVIER_TO_CANAL).forEach((k) => {
    traficByCanal[k] = moisAttribution.reduce(
      (s, m) => s + (CANAUX[m]?.[k] ?? 0),
      0,
    );
  });
  const traficCanalTotal = Object.values(traficByCanal).reduce((s, v) => s + v, 0) || 1;
  const caJanMar = moisAttribution.reduce((s, m) => s + (GLOBAL[m]?.ca ?? 0), 0);
  const resaJanMar = moisAttribution.reduce((s, m) => s + (GLOBAL[m]?.totalResa ?? 0), 0);

  const leviersPerf = BUDGET_LEVIERS.map((l) => {
    const canal = LEVIER_TO_CANAL[l.levier];
    const part = (traficByCanal[canal] ?? 0) / traficCanalTotal;
    // Pour le ROI par levier, on aligne budget et CA sur la même fenêtre
    // Jan-Mars : budget_levier × 3/6 vs CA × part
    const budgetJanMar = l.budget * 0.5;
    const caAttribute = caJanMar * part;
    const resaAttribute = Math.round(resaJanMar * part);
    const roi = budgetJanMar ? caAttribute / budgetJanMar : null;
    return {
      levier: l.levier,
      budget: l.budget,
      budgetJanMar,
      part: l.part,
      partTrafic: part,
      caAttribute,
      resaAttribute,
      roi,
      color: l.color,
    };
  }).sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0));

  return (
    <div className="h-full flex flex-col gap-3">
      {/* KPIs en haut — ROI global */}
      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
        <KPI
          label="ROI YTD (Jan→Avr)"
          value={roiYTD == null ? '—' : `${roiYTD.toFixed(1)}×`}
          hint={`CA ${fmtEuro(caYTD)} / Budget ${fmtEuro(budgetTotal)}`}
          tone="primary"
        />
        <KPI
          label={isCumul ? 'ROI cumulé' : `ROI ${month.charAt(0).toUpperCase() + month.slice(1)}`}
          value={roiMois == null ? '—' : `${roiMois.toFixed(1)}×`}
          hint={caMois && budgetMois ? `CA ${fmtEuro(caMois)} / Budget ${fmtEuro(Math.round(budgetMois))}` : '—'}
        />
        <KPI
          label="Coût acquisition"
          value={cpa == null ? '—' : fmtEuro(Math.round(cpa))}
          hint={`Budget / ${fmtFull(resaYTD)} réservations`}
        />
        <KPI
          label="Ticket moyen"
          value={ticketMoyen == null ? '—' : fmtEuro(Math.round(ticketMoyen))}
          hint="CA / réservation"
          tone="primary"
        />
      </div>

      <div className="text-[10px] uppercase tracking-widest font-semibold flex-shrink-0" style={{ color: COLORS.muted }}>
        Vue saison · ROI mensuel & allocation par levier
        <span className="ml-2" style={{ color: COLORS.warn, fontWeight: 700 }}>⚠ Estimation</span>
        <span className="ml-2 text-[10px]" style={{ color: COLORS.muted }}>budget mensuel = budget cumul Oct→Mars / 6 · CA par levier alloué selon la part de trafic du canal</span>
      </div>

      {/* Évolution ROI mensuel + tableau par levier */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        <ChartContainer title="ROI mensuel" subtitle="CA réservations / budget marketing mensuel moyen">
          <ComposedChart data={roiMensuel}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="mois" {...axisStyle} />
            <YAxis yAxisId="left" {...axisStyle} tickFormatter={(v) => v.toFixed(0) + '×'} />
            <YAxis yAxisId="right" orientation="right" {...axisStyle} tickFormatter={(v) => fmt(v) + '€'} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, name) => {
                if (name === 'ROI') return v.toFixed(1) + '×';
                return fmtEuro(Math.round(v));
              }}
            />
            <Bar yAxisId="right" dataKey="ca" fill={COLORS.primary + '55'} name="CA" radius={[4, 4, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="roi" stroke={COLORS.warn} strokeWidth={2.5} name="ROI" dot={{ r: 4, fill: COLORS.warn }} />
          </ComposedChart>
        </ChartContainer>

        <Card className="col-span-2 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              ROI par levier — fenêtre Jan→Mars 2026
            </div>
            <span className="text-[10px]" style={{ color: COLORS.muted }}>
              · CA attribué proportionnellement à la part de trafic du canal
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background: COLORS.surface }}>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th className="text-left py-1.5 pr-2">Levier</th>
                  <th className="text-right py-1.5 pr-2">Budget Jan→Mar</th>
                  <th className="text-right py-1.5 pr-2">Part trafic</th>
                  <th className="text-right py-1.5 pr-2">Résa attribuées</th>
                  <th className="text-right py-1.5 pr-2">CA attribué</th>
                  <th className="text-right py-1.5 pr-2">ROI</th>
                  <th className="text-right py-1.5">Statut</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {leviersPerf.map((l) => {
                  const roiColor = l.roi == null ? COLORS.muted : l.roi >= 10 ? COLORS.good : l.roi >= 5 ? COLORS.text : l.roi >= 2 ? COLORS.warn : COLORS.bad;
                  return (
                    <tr key={l.levier} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td className="py-1.5 pr-2" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                          {l.levier}
                        </span>
                      </td>
                      <td className="text-right py-1.5 pr-2">{fmtEuro(Math.round(l.budgetJanMar))}</td>
                      <td className="text-right py-1.5 pr-2" style={{ color: COLORS.muted }}>{fmtPct(l.partTrafic, 1)}</td>
                      <td className="text-right py-1.5 pr-2">{fmtFull(l.resaAttribute)}</td>
                      <td className="text-right py-1.5 pr-2" style={{ color: COLORS.primary }}>{fmtEuro(Math.round(l.caAttribute))}</td>
                      <td className="text-right py-1.5 pr-2 font-bold" style={{ color: roiColor }}>
                        {l.roi == null ? '—' : `${l.roi.toFixed(1)}×`}
                      </td>
                      <td className="text-right py-1.5">
                        {l.roi == null ? <span style={{ color: COLORS.muted }}>—</span> :
                         l.roi >= 10 ? <span style={{ color: COLORS.good }}>● Excellent</span> :
                         l.roi >= 5 ? <span style={{ color: COLORS.good }}>● Conforme</span> :
                         l.roi >= 2 ? <span style={{ color: COLORS.warn }}>● Marginal</span> :
                         <span style={{ color: COLORS.bad }}>● Sous-perf</span>}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: COLORS.surface2 }}>
                  <td className="py-1.5 pr-2 font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>TOTAL</td>
                  <td className="text-right py-1.5 pr-2 font-bold">{fmtEuro(Math.round(leviersPerf.reduce((s, l) => s + l.budgetJanMar, 0)))}</td>
                  <td className="text-right py-1.5 pr-2" style={{ color: COLORS.muted }}>100 %</td>
                  <td className="text-right py-1.5 pr-2 font-bold">{fmtFull(leviersPerf.reduce((s, l) => s + l.resaAttribute, 0))}</td>
                  <td className="text-right py-1.5 pr-2 font-bold" style={{ color: COLORS.primary }}>
                    {fmtEuro(Math.round(leviersPerf.reduce((s, l) => s + l.caAttribute, 0)))}
                  </td>
                  <td className="text-right py-1.5 pr-2 font-bold" style={{ color: COLORS.text }}>
                    {(() => {
                      const totBudget = leviersPerf.reduce((s, l) => s + l.budgetJanMar, 0);
                      const totCA = leviersPerf.reduce((s, l) => s + l.caAttribute, 0);
                      return totBudget ? `${(totCA / totBudget).toFixed(1)}×` : '—';
                    })()}
                  </td>
                  <td className="text-right py-1.5" style={{ color: COLORS.muted }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

// === ANALYSE IA ===
// Analyse rule-based des données du cockpit. Génère insights + recommandations
// stratégiques. À terme : remplaçable par un appel LLM (Claude API) pour une
// analyse contextuelle plus riche.

const buildAnalyseIA = () => {
  // ─── Métriques agrégées ────────────────────────────────────────────────
  const traficYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.trafic ?? 0), 0);
  const traficN1YTD = M_LIST.reduce((s, m) => s + (GLOBAL_N1[m]?.trafic ?? 0), 0);
  const traficEvo = traficN1YTD ? (traficYTD - traficN1YTD) / traficN1YTD : null;

  const clickoutsYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.clickouts ?? 0), 0);
  const clickoutsN1YTD = M_LIST.reduce((s, m) => s + (GLOBAL_N1[m]?.clickouts ?? 0), 0);
  const clickoutsEvo = clickoutsN1YTD ? (clickoutsYTD - clickoutsN1YTD) / clickoutsN1YTD : null;

  const resaDirYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.resaDir ?? 0), 0);
  const resaDirN1YTD = M_LIST.reduce((s, m) => s + (GLOBAL_N1[m]?.resaDir ?? 0), 0);
  const resaDirEvo = resaDirN1YTD ? (resaDirYTD - resaDirN1YTD) / resaDirN1YTD : null;

  const resaTotalYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.totalResa ?? 0), 0);
  const resaTotalN1YTD = M_LIST.reduce((s, m) => s + (GLOBAL_N1[m]?.totalResa ?? 0), 0);
  const resaEvo = resaTotalN1YTD ? (resaTotalYTD - resaTotalN1YTD) / resaTotalN1YTD : null;

  const caYTD = M_LIST.reduce((s, m) => s + (GLOBAL[m]?.ca ?? 0), 0);
  const budgetTotal = BUDGET_LEVIERS.reduce((s, l) => s + (l.budget ?? 0), 0);
  const roiYTD = budgetTotal ? caYTD / budgetTotal : null;

  // Budgets par levier
  const seoBudget = BUDGET_LEVIERS.find((l) => l.levier === 'SEO')?.budget ?? 0;
  const seaBudget = BUDGET_LEVIERS.find((l) => l.levier === 'SEA')?.budget ?? 0;
  const rsBudget = BUDGET_LEVIERS.find((l) => l.levier === 'RS')?.budget ?? 0;
  const seoPart = budgetTotal ? seoBudget / budgetTotal : 0;

  // SEO et SEA — évolution YTD vs N-1 (via SEO_PERF / SEA_PERF agrégés)
  const seoTraficYTD = M_LIST.reduce((s, m) => s + (SEO_PERF[m]?.trafic ?? 0), 0);
  const seoTraficN1YTD = M_LIST.reduce((s, m) => s + (SEO_PERF[m]?.n1Trafic ?? 0), 0);
  const seoEvo = seoTraficN1YTD ? (seoTraficYTD - seoTraficN1YTD) / seoTraficN1YTD : null;

  const seaTraficYTD = M_LIST.reduce((s, m) => s + (SEA_PERF[m]?.trafic ?? 0), 0);
  const seaTraficN1YTD = M_LIST.reduce((s, m) => s + (SEA_PERF[m]?.n1Trafic ?? 0), 0);
  const seaEvo = seaTraficN1YTD ? (seaTraficYTD - seaTraficN1YTD) / seaTraficN1YTD : null;

  // Portails — trouver les meilleurs et les pires en évolution
  const portailsCumul = Object.keys(PORTAILS.janvier || {}).map((p) => {
    const trafic = M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.trafic ?? 0), 0);
    const n1 = M_LIST.reduce((s, m) => s + (PORTAILS[m]?.[p]?.n1 ?? 0), 0);
    return { portail: p, trafic, n1, evo: n1 ? (trafic - n1) / n1 : null };
  });
  const portailsTriParEvo = [...portailsCumul]
    .filter((p) => p.evo !== null && p.portail !== 'MC')
    .sort((a, b) => (a.evo ?? 0) - (b.evo ?? 0));
  const portailEnChute = portailsTriParEvo[0];
  const portailEnHausse = portailsTriParEvo[portailsTriParEvo.length - 1];

  // SEA pays critiques
  const paysSEACritique = SEA_PAYS
    .filter((p) => p.clickoutsObj > 1000 && (p.clickoutsReel / p.clickoutsObj) < 0.25)
    .sort((a, b) => (a.clickoutsReel / a.clickoutsObj) - (b.clickoutsReel / b.clickoutsObj));

  // CRM base growth
  const baseDebut = CRM_BASE.janvier?.total ?? 0;
  const baseFin = CRM_BASE.avril?.total ?? 0;
  const baseEvo = baseDebut ? (baseFin - baseDebut) / baseDebut : null;

  // Campagnes CRM passées : meilleure
  const meilleureCampagne = [...CRM_CAMPAGNES]
    .filter((c) => c.resultats)
    .sort((a, b) => (b.resultats?.conversions ?? 0) - (a.resultats?.conversions ?? 0))[0];

  // ─── Génération des insights ──────────────────────────────────────────
  const forces = [];
  const risques = [];
  const recommandations = [];

  // Forces
  if (seaEvo != null && seaEvo > 0.2) {
    forces.push({
      titre: 'SEA en forte croissance',
      detail: `+${(seaEvo * 100).toFixed(0)} % de trafic SEA vs N-1 sur Jan→Mars. ` +
        `Le SEA est devenu le 2ᵉ canal d'acquisition (${fmt(seaTraficYTD)} visites cumulées).`,
      icon: 'good',
    });
  }
  if (roiYTD != null && roiYTD >= 15) {
    forces.push({
      titre: `ROI YTD excellent : ${roiYTD.toFixed(1)}×`,
      detail: `${fmtEuro(caYTD)} de CA sur Jan→Avr pour ${fmtEuro(budgetTotal)} de budget marketing — ` +
        `chaque euro investi rapporte ${roiYTD.toFixed(0)} € de réservations.`,
      icon: 'good',
    });
  }
  if (portailEnHausse && portailEnHausse.evo > 0.3) {
    forces.push({
      titre: `${PORTAIL_LABELS[portailEnHausse.portail]} : moteur du portefeuille`,
      detail: `+${(portailEnHausse.evo * 100).toFixed(0)} % de trafic vs N-1 sur 4 mois (${fmt(portailEnHausse.trafic)} visites). ` +
        `À sécuriser avant la haute saison.`,
      icon: 'good',
    });
  }
  if (baseEvo != null && baseEvo > 0.2) {
    forces.push({
      titre: 'Base CRM en croissance saine',
      detail: `+${(baseEvo * 100).toFixed(0)} % de contacts entre janvier et avril ` +
        `(${fmt(baseDebut)} → ${fmt(baseFin)}). Acquisition d'audience efficace pour la saison.`,
      icon: 'good',
    });
  }
  if (meilleureCampagne) {
    forces.push({
      titre: `« ${meilleureCampagne.nom} » : meilleure campagne CRM`,
      detail: `${fmtFull(meilleureCampagne.resultats.conversions)} conversions, ` +
        `tx ouverture ${fmtPct(meilleureCampagne.resultats.txOuverture, 0)}, tx clic ${fmtPct(meilleureCampagne.resultats.txClic, 0)}. ` +
        `Pattern à dupliquer.`,
      icon: 'good',
    });
  }

  // Risques
  if (resaDirEvo != null && resaDirEvo < -0.05) {
    risques.push({
      titre: 'Réservations directes en baisse',
      detail: `${(resaDirEvo * 100).toFixed(0)} % YTD vs N-1 (${fmtFull(resaDirYTD)} vs ${fmtFull(resaDirN1YTD)}). ` +
        `Baisse mécanique du CA direct alors que le trafic global progresse — paradoxe à investiguer.`,
      icon: 'bad',
    });
  }
  if (seoEvo != null && seoEvo < -0.1) {
    risques.push({
      titre: 'SEO en chute libre',
      detail: `${(seoEvo * 100).toFixed(0)} % de trafic SEO vs N-1, alors que le levier consomme ` +
        `${fmtPct(seoPart, 0)} du budget marketing (${fmtEuro(seoBudget)}). ` +
        `Probable impact AI Overviews Google.`,
      icon: 'bad',
    });
  }
  if (portailEnChute && portailEnChute.evo < -0.3) {
    risques.push({
      titre: `${PORTAIL_LABELS[portailEnChute.portail]} : décrochage majeur`,
      detail: `${(portailEnChute.evo * 100).toFixed(0)} % de trafic vs N-1 (${fmt(portailEnChute.trafic)} vs ${fmt(portailEnChute.n1)}). ` +
        `Choix structurel à faire : restructurer ou désinvestir.`,
      icon: 'bad',
    });
  }
  if (paysSEACritique.length > 0) {
    risques.push({
      titre: `${paysSEACritique.length} marchés SEA en alerte rouge`,
      detail: `${paysSEACritique.slice(0, 3).map((p) => `${p.pays} ${fmtPct(p.clickoutsReel / p.clickoutsObj, 0)}`).join(' · ')}. ` +
        `${paysSEACritique.reduce((s, p) => s + (p.clickoutsObj - p.clickoutsReel), 0).toFixed(0)} clickouts d'objectif annuel non lancés.`,
      icon: 'bad',
    });
  }
  if (rsBudget > 5000) {
    risques.push({
      titre: 'RS : budget sans ROI traçable',
      detail: `${fmtEuro(rsBudget)} sur Insta + Pinterest depuis octobre, ` +
        `mais 0 réservation directe attribuée. Soit le tracking est cassé, soit le levier ne convertit pas.`,
      icon: 'bad',
    });
  }

  // Recommandations
  if (seaEvo != null && seaEvo > 0.2 && seoEvo != null && seoEvo < -0.1) {
    recommandations.push({
      priorite: 'haute',
      titre: 'Réallouer budget SEO → SEA',
      detail: `Le SEA est ${(seaEvo * 100).toFixed(0)} % en croissance, le SEO ${(seoEvo * 100).toFixed(0)} %. ` +
        `Mouvement type : −10 pts SEO (~${fmtEuro(seoBudget * 0.1)}), +50 % SEA (~${fmtEuro(seaBudget * 0.5)}). ` +
        `Net efficience attendu : +${fmtEuro((seaBudget * 0.5 * (roiYTD || 1)) - (seoBudget * 0.1 * (roiYTD || 1)))} sur 6 mois.`,
      impact: 'Gain ROI estimé : +15 à 25 %',
    });
  }
  if (paysSEACritique.length > 0) {
    recommandations.push({
      priorite: 'haute',
      titre: 'Activer ou désinvestir les marchés SEA dormants',
      detail: `${paysSEACritique.map((p) => p.pays).join(', ')} affichent < 25 % de l'objectif. ` +
        `Décision binaire à prendre avant juin : lancer les campagnes ou rebudgetter sur FR/Ucamping qui sur-performent.`,
      impact: `Budget bloqué : ${fmtEuro(paysSEACritique.reduce((s, p) => s + p.budgetObj - p.budgetReel, 0))}`,
    });
  }
  if (resaDirEvo != null && resaDirEvo < -0.05) {
    recommandations.push({
      priorite: 'haute',
      titre: 'Auditer le tunnel de conversion résa directe',
      detail: `Trafic +${traficEvo ? (traficEvo * 100).toFixed(0) : '?'} % mais résa directes ${(resaDirEvo * 100).toFixed(0)} %. ` +
        `Audit UX du formulaire + AB test sur la page de réservation directe avant le pic juin.`,
      impact: 'Récupérer ~50 résa/mois = ~35 k€ CA',
    });
  }
  recommandations.push({
    priorite: 'moyenne',
    titre: 'Investir dans le contenu CRM allemand',
    detail: `La langue DE affiche 28,9 % de tx ouverture et 8 % de CTR — ` +
      `5× la moyenne. Avec seulement 12 % de la base, c'est le segment le plus engagé. ` +
      `Calendrier éditorial dédié et contenus localisés.`,
    impact: 'ROI marginal CRM le plus élevé du portefeuille',
  });
  if (rsBudget > 5000) {
    recommandations.push({
      priorite: 'moyenne',
      titre: 'Trancher sur le levier RS',
      detail: `${fmtEuro(rsBudget)} dépensés pour 0 résa directe attribuée. ` +
        `Soit on instrumente le tracking (UTM + GA4 events) sur 60 jours, soit on coupe et on réalloue vers SEA + IA.`,
      impact: `Budget réallouable : ${fmtEuro(rsBudget * 0.5)}`,
    });
  }
  recommandations.push({
    priorite: 'basse',
    titre: 'Activer le canal CRM dans le mix d\'acquisition',
    detail: `27 k abonnés positionnés mais seulement 478 entrées trafic en mars (1,8 %). ` +
      `Calendrier hebdo CRM avec liens vers les fiches camping pour densifier l'usage.`,
    impact: 'Trafic supplémentaire : ~2-3 k visites/mois',
  });

  return {
    metriques: {
      traficYTD, traficEvo,
      clickoutsYTD, clickoutsEvo,
      caYTD, roiYTD,
      resaTotalYTD, resaEvo,
    },
    forces,
    risques,
    recommandations,
  };
};

const PRIORITE_CONFIG = {
  haute:   { label: 'PRIORITÉ HAUTE',   color: '#F87171' },
  moyenne: { label: 'PRIORITÉ MOYENNE', color: '#FBBF24' },
  basse:   { label: 'PRIORITÉ BASSE',   color: '#22D3CC' },
};

const AnalyseIAPage = () => {
  const { metriques, forces, risques, recommandations } = buildAnalyseIA();

  return (
    <div className="h-full flex flex-col gap-3 overflow-y-auto">
      {/* Synthèse + KPIs résumés */}
      <Card className="flex-shrink-0" style={{ borderLeft: `3px solid ${COLORS.primary}` }}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 flex-shrink-0" style={{ background: COLORS.primary + '22' }}>
            <Sparkles size={18} style={{ color: COLORS.primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.primary }}>
                Synthèse exécutive
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{ background: COLORS.warn + '22', color: COLORS.warn }}>
                ⚠ Pseudo-IA · rule-based
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>
              Saison 2026 sur les 4 premiers mois : <strong style={{ color: COLORS.primary }}>{fmt(metriques.traficYTD)} visites</strong>
              {metriques.traficEvo != null && <span style={{ color: metriques.traficEvo >= 0 ? COLORS.good : COLORS.bad }}> ({metriques.traficEvo >= 0 ? '+' : ''}{(metriques.traficEvo * 100).toFixed(0)} % vs N-1)</span>},
              {' '}<strong>{fmtEuro(metriques.caYTD)}</strong> de CA réservations
              {metriques.resaEvo != null && <span style={{ color: metriques.resaEvo >= 0 ? COLORS.good : COLORS.bad }}> ({metriques.resaEvo >= 0 ? '+' : ''}{(metriques.resaEvo * 100).toFixed(0)} % résa)</span>},
              {' '}ROI marketing global de <strong style={{ color: COLORS.primary }}>{metriques.roiYTD ? metriques.roiYTD.toFixed(1) + '×' : '—'}</strong>.
              {' '}Le mix d'acquisition se rééquilibre du SEO vers le SEA, avec une base CRM qui s'étoffe rapidement.
              {' '}<strong>{recommandations.filter((r) => r.priorite === 'haute').length} actions prioritaires</strong> identifiées
              {' '}pour optimiser la suite de saison.
            </p>
          </div>
        </div>
      </Card>

      {/* Forces + Risques */}
      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
        <Card style={{ borderLeft: `3px solid ${COLORS.good}` }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} style={{ color: COLORS.good }} />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.good }}>
              Forces — {forces.length} signaux positifs
            </span>
          </div>
          <ul className="space-y-2.5">
            {forces.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center mt-0.5" style={{ background: COLORS.good + '22' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.good }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold mb-0.5" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {f.titre}
                  </div>
                  <div className="text-[11px]" style={{ color: '#C0C0C0', lineHeight: 1.5 }}>{f.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card style={{ borderLeft: `3px solid ${COLORS.bad}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: COLORS.bad }} />
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.bad }}>
              Risques — {risques.length} signaux d'alerte
            </span>
          </div>
          <ul className="space-y-2.5">
            {risques.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center mt-0.5" style={{ background: COLORS.bad + '22' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.bad }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold mb-0.5" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {r.titre}
                  </div>
                  <div className="text-[11px]" style={{ color: '#C0C0C0', lineHeight: 1.5 }}>{r.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recommandations */}
      <Card className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: COLORS.primary }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: COLORS.primary }}>
            Recommandations stratégiques — {recommandations.length} actions
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recommandations.map((reco, i) => {
            const cfg = PRIORITE_CONFIG[reco.priorite];
            return (
              <div key={i} className="rounded-lg p-3" style={{ background: COLORS.surface2, border: `1px solid ${cfg.color}33` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                    style={{ background: cfg.color + '22', color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="text-[13px] font-semibold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {reco.titre}
                </div>
                <div className="text-[11px] mb-2" style={{ color: '#C0C0C0', lineHeight: 1.5 }}>{reco.detail}</div>
                {reco.impact && (
                  <div className="text-[10px] flex items-center gap-1.5 pt-2 border-t" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
                    <TrendingUp size={11} style={{ color: COLORS.primary }} />
                    <span>Impact attendu :</span>
                    <span style={{ color: COLORS.primary, fontWeight: 600 }}>{reco.impact}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// === CLIENTS ===
const ClientsPage = () => {
  const totalCA = CA_PRODUITS.reduce((s, p) => s + (p.ca ?? 0), 0);
  const evoAB = CAMPINGS.n1 ? (CAMPINGS.abonnement - CAMPINGS.n1) / CAMPINGS.n1 : null;
  const [search, setSearch] = useState('');

  const filtered = CLIENTS.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nom.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.statut.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
        <KPI label="CA Pack Trafic YTD" value={fmtEuro(totalCA)} hint="Cumul Octobre → Mars 2026" tone="primary"/>
        <KPI label="Campings PT total" value={fmtFull(CAMPINGS.total)} hint={`${CAMPINGS.abonnement ?? '—'} en AB · ${CAMPINGS.ppc ?? '—'} en PPC`} />
        <KPI label="Abonnement vs N-1" value={evoAB == null ? '—' : `${evoAB >= 0 ? '+' : ''}${(evoAB * 100).toFixed(0)}%`} hint={`vs ${fmtFull(CAMPINGS.n1)} n-1`} evo={evoAB} />
        <KPI label="PPC à sec" value={CAMPINGS.ppc ? `${CAMPINGS.ppcSansBudget}/${CAMPINGS.ppc}` : '—'} hint={CAMPINGS.ppc ? `${fmtPct(CAMPINGS.ppcSansBudget / CAMPINGS.ppc, 0)} sans budget` : ''} tone="primary"/>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Listing clients</div>
            <FictifBadge />
            <span className="text-[10px]" style={{ color: COLORS.muted }}>
              · {filtered.length} / {CLIENTS.length}
            </span>
          </div>
          <div
            className="flex items-center rounded-md"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}` }}
          >
            <Search size={12} style={{ color: COLORS.muted, marginLeft: 8 }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client (nom, type, statut)…"
              className="bg-transparent border-0 outline-none px-2 py-1.5 text-xs"
              style={{ color: COLORS.text, fontFamily: 'Manrope, sans-serif', width: 280 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="rounded p-1 hover:bg-white/10 mr-1"
                style={{ color: COLORS.muted }}
                aria-label="Effacer la recherche"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10" style={{ background: COLORS.surface }}>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="text-left py-1.5 pr-2">Client</th>
                <th className="text-left py-1.5 pr-2">Type</th>
                <th className="text-left py-1.5 pr-2">Statut</th>
                <th className="text-right py-1.5 pr-2">Trafic / mois</th>
                <th className="text-right py-1.5 pr-2">Clickouts / mois</th>
                <th className="text-right py-1.5 pr-2">Tx conv.</th>
                <th className="text-right py-1.5">Résa / mois</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {filtered.map((c) => {
                const isAB = c.type === 'AB';
                const isSansBudget = c.statut === 'Sans budget';
                const pctRestant = c.budgetMensuel ? c.budgetRestant / c.budgetMensuel : null;
                // Couleur du statut PPC selon le budget restant
                const ppcColor = isSansBudget
                  ? COLORS.bad
                  : pctRestant != null && pctRestant < 0.2
                    ? COLORS.warn
                    : COLORS.good;
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td className="py-1.5 pr-2" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>{c.nom}</td>
                    <td className="py-1.5 pr-2">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{
                          background: isAB ? COLORS.primary + '22' : '#FB923C22',
                          color: isAB ? COLORS.primary : '#FB923C',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                        }}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2">
                      {isAB ? (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                          style={{
                            background: COLORS.good + '22',
                            color: COLORS.good,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        >
                          ●&nbsp;Actif
                        </span>
                      ) : (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                          style={{
                            background: ppcColor + '22',
                            color: ppcColor,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                          title={`${fmtEuro(c.budgetRestant)} restant sur ${fmtEuro(c.budgetMensuel)} de budget mensuel`}
                        >
                          ●&nbsp;{fmtEuro(c.budgetRestant)} / {fmtEuro(c.budgetMensuel)}
                        </span>
                      )}
                    </td>
                    <td className="text-right py-1.5 pr-2">{fmtFull(c.trafic)}</td>
                    <td className="text-right py-1.5 pr-2">{fmtFull(c.clickouts)}</td>
                    <td className="text-right py-1.5 pr-2" style={{ color: c.txConv >= 0.45 ? COLORS.good : c.txConv >= 0.25 ? COLORS.text : COLORS.bad }}>
                      {fmtPct(c.txConv, 0)}
                    </td>
                    <td className="text-right py-1.5" style={{ color: COLORS.primary }}>{fmtFull(c.resa)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-[11px]" style={{ color: COLORS.muted }}>
                    Aucun client ne correspond à « {search} ».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* =========================================================================
   LOGIN
   ========================================================================= */
// ⚠ Protection cosmétique uniquement : le mot de passe est dans le source
// (visible par n'importe qui via les devtools / GitHub). Pour une vraie
// auth il faudra une couche backend.
const APP_PASSWORD = 'test';

const LoginScreen = ({ onSuccess }) => {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (pwd === APP_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setPwd('');
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center px-4"
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: 'Manrope, sans-serif' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-7"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.primary}55`,
          boxShadow: `0 0 0 1px ${COLORS.primary}11, 0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${COLORS.primary}22`,
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Logo size={42} />
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', fontSize: 22 }}>
              ctoutvert
            </div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: COLORS.primary }}>
              Cockpit Saison 26
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <label className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: COLORS.muted }}>
            <Lock size={11} />
            Mot de passe
          </label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false); }}
            autoFocus
            placeholder="••••"
            className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: COLORS.surface2,
              border: `1px solid ${error ? COLORS.bad : COLORS.border}`,
              color: COLORS.text,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          {error && (
            <div className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: COLORS.bad }}>
              <AlertCircle size={12} />
              Mot de passe incorrect
            </div>
          )}
          <button
            type="submit"
            className="w-full mt-4 rounded-md py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: COLORS.primary, color: '#000', fontFamily: 'Manrope, sans-serif' }}
          >
            Se connecter
          </button>
        </form>

        <div className="text-[10px] mt-5 pt-4 border-t text-center" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
          Accès restreint · Données saison 2026 Inaxel
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   APP
   ========================================================================= */
export default function App() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem('cockpit-auth') === 'ok';
    } catch {
      return false;
    }
  });
  const [active, setActive] = useState('dashboard');
  const [month, setMonth] = useState('avril');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  if (!authed) {
    return (
      <LoginScreen
        onSuccess={() => {
          try { sessionStorage.setItem('cockpit-auth', 'ok'); } catch (_) {}
          setAuthed(true);
        }}
      />
    );
  }

  const logout = () => {
    try { sessionStorage.removeItem('cockpit-auth'); } catch (_) {}
    setAuthed(false);
  };

  const PAGES = {
    dashboard: { title: "Vue d'ensemble", subtitle: 'Saison 2026 — pilotage consolidé', component: DashboardPage },
    portails: { title: 'Portails', subtitle: 'Performance trafic par site', component: PortailsPage },
    sea: { title: 'SEA', subtitle: 'Acquisition payante par marché', component: SEAPage },
    crm: { title: 'CRM', subtitle: 'Base abonnés et email marketing', component: CRMPage },
    performance: { title: 'Performance', subtitle: 'ROI marketing — par mois et par levier', component: PerformancePage },
    clients: { title: 'Clients', subtitle: 'Portefeuille campings et performance individuelle', component: ClientsPage },
    analyse: { title: 'Analyse IA', subtitle: 'Insights automatisés et recommandations stratégiques', component: AnalyseIAPage },
  };

  const PageComponent = PAGES[active].component;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: COLORS.bg, color: COLORS.text, fontFamily: 'Manrope, sans-serif' }}>
      <Sidebar active={active} setActive={setActive} onLogout={logout} />
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: COLORS.bg }}>
        <Header pageTitle={PAGES[active].title} pageSubtitle={PAGES[active].subtitle} month={month} setMonth={setMonth} />
        <div className="flex-1 overflow-hidden px-6 py-3 flex justify-center">
          <div
            className="w-full h-full overflow-hidden rounded-xl p-3"
            style={{ maxWidth: 1300, border: `1px solid ${COLORS.border}` }}
          >
            <PageComponent month={month} />
          </div>
        </div>
        <footer className="px-6 py-2 border-t text-[11px] flex justify-between flex-shrink-0" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
          <span>Source unique : page Notion « Cockpit Saison 2026 »</span>
          {SYNCED_AT && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Dernière sync : {new Date(SYNCED_AT).toLocaleString('fr-FR')}
            </span>
          )}
        </footer>
      </main>
    </div>
  );
}
