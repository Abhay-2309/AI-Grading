import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../services/api';

const TIER_STYLES = {
  Baseline: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: '#10b981' },
  Elevated: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: '#3b82f6' },
  'Moderate Risk': { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: '#f59e0b' },
  'Critical Risk': { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: '#ef4444' },
};

const SCORE_MIN = 300;
const SCORE_MAX = 900;

export default function RiskScoring({ returns = [] }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

  const loadRisk = useCallback(() => {
    setLoading(true);
    setError('');
    return apiFetch('/api/profile/risk-score')
      .then(setRisk)
      .catch((err) => setError(err.message || 'Failed to load risk profile.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRisk();
  }, [loadRisk]);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimMessage('');
    try {
      const result = await apiFetch('/api/profile/risk-score/claim-reward', { method: 'POST' });
      setClaimMessage(`+${result.rewardCredits} Green Credits awarded for your ${result.tier} score!`);
      await loadRisk();
    } catch (err) {
      setClaimMessage(err.message || 'Failed to claim reward.');
    } finally {
      setClaiming(false);
    }
  };

  // The customer's own return history that fed into this score — any row
  // with a real customerId links back to a tracked account (decorative
  // demo rows have none).
  const myReturns = returns.filter((r) => r.customerId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !risk) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-sm font-bold text-red-700">Couldn't load account risk profile</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const style = TIER_STYLES[risk.tier] || TIER_STYLES['Moderate Risk'];
  const scorePct = ((risk.score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference * (1 - scorePct / 100);

  return (
    <div className="flex-1 flex flex-col min-h-0 text-left space-y-6 p-6 overflow-y-auto">
      <div>
        <h2 className="font-headline-md text-on-surface text-xl font-bold">Account Risk &amp; Trust Score</h2>
        <p className="text-on-surface-variant text-xs mt-1">
          A CIBIL-style score computed from real order and return behavior — not a hardcoded label.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Gauge */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-outline-variant/30" />
              <circle
                cx="80" cy="80" r="70" fill="none"
                stroke={style.ring} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-on-surface font-mono">{risk.score}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">of {SCORE_MAX}</span>
            </div>
          </div>
          <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
            {risk.tier}
          </div>
        </div>

        {/* Breakdown */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-on-surface text-sm">Score Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold">Total Orders</p>
              <p className="text-xl font-bold text-on-surface font-mono">{risk.totalOrdersPlaced}</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold">Total Returned</p>
              <p className="text-xl font-bold text-on-surface font-mono">{risk.totalReturns}</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold">Return Rate</p>
              <p className="text-xl font-bold text-on-surface font-mono">{(risk.returnRate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold">Grade Disagreements</p>
              <p className="text-xl font-bold text-on-surface font-mono">{risk.totalDisagreements}</p>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-on-surface-variant">
                {risk.rewardCredits > 0
                  ? `Your ${risk.tier} score qualifies for a green credit reward.`
                  : 'Keep your return rate low to unlock green credit rewards.'}
              </p>
              {claimMessage && <p className="text-xs font-bold text-primary mt-1">{claimMessage}</p>}
            </div>
            {risk.rewardClaimable ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {claiming ? 'Claiming...' : `Claim +${risk.rewardCredits} Green Credits`}
              </button>
            ) : (
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-4 py-2 rounded-lg">
                {risk.greenCredits} Green Credits
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Real return history that fed into this score */}
      <div className="bg-surface-container border border-outline-variant rounded-xl flex flex-col shadow-sm">
        <div className="p-4 border-b border-outline-variant">
          <h3 className="font-bold text-on-surface text-sm">Return History Behind This Score</h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Every submitted return on this account, most recent first.</p>
        </div>
        {myReturns.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-xs">No returns on this account yet.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-container-high text-on-surface-variant">
                <tr>
                  <th className="p-3 text-xs uppercase tracking-wider">Item</th>
                  <th className="p-3 text-xs uppercase tracking-wider">Status</th>
                  <th className="p-3 text-xs uppercase tracking-wider">AI Grade</th>
                  <th className="p-3 text-xs uppercase tracking-wider">Routing</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-right">Disagreements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {myReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-high/50">
                    <td className="p-3 font-semibold text-sm">{item.itemName}</td>
                    <td className="p-3 text-sm">{item.status}</td>
                    <td className="p-3 text-sm font-mono">{item.userGrade || '—'}</td>
                    <td className="p-3 text-sm">{item.routing || '—'}</td>
                    <td className="p-3 text-sm text-right font-mono">{item.disagreementCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
