import React, { useState } from 'react';

// Real leaderboard rows only carry rank/name/verifiedCount/accuracy/avgSpeed/score
// (from GET /api/profile/leaderboard) — derive the display-only fields (initials,
// id, trend, status) that have no backing data model.
function toDisplayAgent(entry) {
  const initials = entry.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    rank: `#${String(entry.rank).padStart(2, '0')}`,
    name: entry.name,
    id: `ID-${entry.rank}${entry.verifiedCount}`,
    initials,
    accuracy: entry.accuracy,
    verifications: entry.verifiedCount.toLocaleString(),
    disagreements: Math.max(0, Math.round((100 - parseFloat(entry.accuracy)) * 2)),
    trend: entry.rank <= 2 ? 'up' : 'flat',
    status: 'Active',
  };
}

export default function Leaderboard({ leaderboardData = [], searchQuery = '' }) {
  const [showToast, setShowToast] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Last 30 Days');

  const displayAgents = leaderboardData.map(toDisplayAgent);

  const filteredAgents = displayAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 text-left p-6 space-y-6 overflow-y-auto relative">
      
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
        <div>
          <h2 className="text-slate-800 text-2xl font-bold mb-1">Agent Performance Leaderboard</h2>
          <p className="text-slate-450 text-xs font-semibold">Benchmarking verification accuracy against established ground truth datasets.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent border-none text-slate-650 focus:ring-0 p-0 pr-6 text-xs font-bold cursor-pointer"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
          </div>
          <button className="bg-[#ffa726] hover:bg-[#fb8c00] text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm cursor-pointer transition-colors border-none">
            <span className="material-symbols-outlined text-[18px]">download</span>
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Four Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Global Accuracy</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 font-mono">94.2%</span>
            <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">↓ 0.4%</span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verifications</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 font-mono">12,842</span>
            <span className="text-[10px] text-emerald-650 font-bold flex items-center gap-0.5">↑ 12%</span>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avg. Review Time</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 font-mono">1m 14s</span>
            <span className="text-[10px] text-slate-450 font-bold flex items-center gap-0.5">— stable</span>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Disagreement Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 font-mono">2.8%</span>
            <span className="text-[10px] text-emerald-650 font-bold flex items-center gap-0.5">↓ 1.1%</span>
          </div>
        </div>
      </div>

      {/* Rankings Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden flex-shrink-0">
        {/* Rankings Header */}
        <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Rankings</span>
            <span className="bg-orange-50 text-orange-650 px-2.5 py-0.5 rounded text-[10px] font-bold border border-orange-100 uppercase tracking-wider">Top Performers</span>
            <span className="text-slate-400 font-semibold text-[10px] hover:text-slate-600 cursor-pointer uppercase tracking-wider">All Teams</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-lg hover:text-slate-600 cursor-pointer">tune</span>
            <span className="material-symbols-outlined text-lg hover:text-slate-600 cursor-pointer">more_vert</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 font-bold">
                <th className="px-5 py-3 text-xs uppercase tracking-wider w-24">Rank</th>
                <th className="px-5 py-3 text-xs uppercase tracking-wider">Agent</th>
                <th className="px-5 py-3 text-xs uppercase tracking-wider text-center">Accuracy Score</th>
                <th className="px-5 py-3 text-xs uppercase tracking-wider text-center">Total Verifications</th>
                <th className="px-5 py-3 text-xs uppercase tracking-wider text-center">Disagreements</th>
                <th className="px-5 py-3 text-xs uppercase tracking-wider text-center w-24">Trend</th>
                <th className="px-5 py-3 text-xs uppercase tracking-wider text-center w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredAgents.map((agent) => {
                const isRankOne = agent.rank === '#01';
                const isDisagreementHigh = agent.disagreements >= 5;
                
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className={`px-5 py-4 font-bold text-sm ${isRankOne ? 'text-[#ffa726]' : 'text-slate-400'}`}>
                      {agent.rank}
                    </td>
                    <td className="px-5 py-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                        isRankOne 
                          ? 'bg-[#fff8ec] text-[#e65100] border border-orange-100' 
                          : 'bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]'
                      }`}>
                        {agent.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm leading-tight">{agent.name}</div>
                        <div className="text-[10px] text-slate-450 font-semibold">{agent.id}</div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-center font-bold text-sm ${isRankOne ? 'text-[#ffa726]' : 'text-slate-700'}`}>
                      {agent.accuracy}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold font-mono text-slate-700">
                      {agent.verifications}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${
                        isDisagreementHigh 
                          ? 'bg-orange-50 text-orange-650 border-orange-100' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {agent.disagreements}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`material-symbols-outlined text-base font-bold ${
                        agent.trend === 'up' ? 'text-[#ffa726]' : 'text-slate-400'
                      }`}>
                        {agent.trend === 'up' ? 'trending_up' : 'trending_flat'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-center justify-center w-full">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 'Active' ? 'bg-[#ffa726] animate-pulse' : 'bg-slate-400'
                        }`}></span>
                        <span className={`text-[11px] font-bold ${
                          agent.status === 'Active' ? 'text-[#ffa726]' : 'text-slate-400'
                        }`}>{agent.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 border-t border-slate-150 flex justify-between items-center bg-slate-50/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SHOWING 1-{filteredAgents.length} OF {displayAgents.length} AGENTS</span>
          <div className="flex gap-1.5">
            <button className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-50 rounded flex items-center justify-center text-slate-450 cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-50 rounded flex items-center justify-center text-slate-455 cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Bottom Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Team Accuracy Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm md:col-span-7 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-lg">trending_up</span>
              <span className="font-bold text-slate-800 text-sm">Team Accuracy Distribution</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-lg">bar_chart</span>
          </div>
          
          {/* Histogram Bars */}
          <div className="flex items-end justify-between h-40 px-4 pb-2 border-b border-slate-150 relative">
            {/* Bar 1 */}
            <div className="flex flex-col items-center w-[10%]">
              <div className="bg-slate-100 border border-slate-200 w-full rounded-t" style={{ height: '30px' }}></div>
              <span className="text-[9px] text-slate-400 font-bold mt-2">70%</span>
            </div>
            {/* Bar 2 */}
            <div className="flex flex-col items-center w-[10%]">
              <div className="bg-slate-100 border border-slate-200 w-full rounded-t" style={{ height: '55px' }}></div>
            </div>
            {/* Bar 3 */}
            <div className="flex flex-col items-center w-[10%]">
              <div className="bg-slate-100 border border-slate-200 w-full rounded-t" style={{ height: '70px' }}></div>
              <span className="text-[9px] text-slate-400 font-bold mt-2">80%</span>
            </div>
            {/* Bar 4 (Highlighted Orange) */}
            <div className="flex flex-col items-center w-[10%] relative">
              <span className="absolute -top-5 text-[8px] font-bold text-orange-500 uppercase tracking-widest">Current</span>
              <div className="bg-[#ffa726] w-full rounded-t" style={{ height: '120px' }}></div>
            </div>
            {/* Bar 5 */}
            <div className="flex flex-col items-center w-[10%]">
              <div className="bg-slate-100 border border-slate-200 w-full rounded-t" style={{ height: '90px' }}></div>
              <span className="text-[9px] text-slate-400 font-bold mt-2">90%</span>
            </div>
            {/* Bar 6 */}
            <div className="flex flex-col items-center w-[10%]">
              <div className="bg-slate-100 border border-slate-200 w-full rounded-t" style={{ height: '45px' }}></div>
            </div>
            {/* Bar 7 */}
            <div className="flex flex-col items-center w-[10%]">
              <div className="bg-slate-100 border border-slate-200 w-full rounded-t" style={{ height: '20px' }}></div>
              <span className="text-[9px] text-slate-400 font-bold mt-2">100%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Review Calibration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm md:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Review Calibration</h3>
            <p className="text-slate-450 text-[11px] font-semibold leading-normal mb-4">High-risk agents flagged for disagreement analysis based on recent verification discrepancies.</p>
            
            {/* Alerts List */}
            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="border border-slate-200 rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base">warning</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Critical Delta</h4>
                    <p className="text-[10px] text-slate-455 font-semibold">4 agents below 85% threshold</p>
                  </div>
                </div>
                <button className="bg-white hover:bg-slate-50 border border-slate-200 text-[#ffa726] border-slate-200/50 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors">
                  REVIEW
                </button>
              </div>

              {/* Alert 2 */}
              <div className="border border-slate-200 rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base">psychology</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Cognitive Bias Alert</h4>
                    <p className="text-[10px] text-slate-455 font-semibold">Systematic approval pattern detected in Region A</p>
                  </div>
                </div>
                <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 border-slate-200/50 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors">
                  DETAILS
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-white border border-orange-100 text-slate-800 p-4 rounded-xl shadow-xl z-50 flex items-center gap-3 max-w-sm">
          <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 text-orange-550 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">info</span>
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-slate-800 text-xs leading-snug">Data Refreshed</h4>
            <p className="text-[10px] text-slate-450 font-semibold leading-normal mt-0.5">The leaderboard now reflects verifications up to 14:00 UTC.</p>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent flex items-center justify-center p-1.5 rounded-full hover:bg-slate-100 transition-colors w-8 h-8 shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

    </div>
  );
}
