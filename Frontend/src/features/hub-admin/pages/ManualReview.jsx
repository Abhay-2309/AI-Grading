import React, { useState } from 'react';

export default function ManualReview({ returns, onSelectCase, searchQuery, setSearchQuery }) {
  const [selectedItems, setSelectedItems] = useState({});

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    const nextSelected = {};
    if (checked) {
      filteredReturns.forEach(item => {
        nextSelected[item.id] = true;
      });
    }
    setSelectedItems(nextSelected);
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredReturns = returns.filter(item => 
    item.id.startsWith('ITEM-') && (
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const renderGradePill = (grade) => {
    if (!grade) return (
      <span className="text-slate-400 italic text-xs">Pending Review</span>
    );
    
    let bgClass = 'bg-slate-50 text-slate-700 border-slate-200';
    let dotClass = 'bg-slate-500';
    
    const g = grade.toUpperCase();
    if (g.includes('A') || g.includes('B')) {
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-150';
      dotClass = 'bg-emerald-500';
    } else if (g.includes('C')) {
      bgClass = 'bg-amber-50 text-amber-750 border-amber-150';
      dotClass = 'bg-amber-500';
    } else if (g.includes('D')) {
      bgClass = 'bg-orange-50 text-orange-750 border-orange-150';
      dotClass = 'bg-orange-500';
    } else if (g.includes('F')) {
      bgClass = 'bg-red-50 text-red-700 border-red-150';
      dotClass = 'bg-red-500';
    }
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${bgClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
        <span>{grade}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 text-left p-6">
      {/* Top Header Banner */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-sans text-[#1e293b] font-bold text-2xl tracking-tight">Manual Review Queue</h2>
            <p className="text-sm text-slate-500">{filteredReturns.length} active disputes requiring intervention</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#ffa726] hover:bg-[#fb8c00] text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">assignment_ind</span>
              ASSIGN TO REVIEWER
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="flex items-center gap-2 px-2 border-r border-slate-200 pr-4">
            <span className="material-symbols-outlined text-slate-400 text-sm">filter_alt</span>
            <span className="font-semibold text-slate-400 text-xs tracking-wider">FILTERS</span>
          </div>
          
          <div className="flex flex-wrap gap-2 flex-1 items-center">
            <button className="bg-amber-50 border border-amber-200/60 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-100/50 transition-colors">
              Flag Reason: All
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            <button className="bg-amber-50 border border-amber-200/60 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-100/50 transition-colors">
              Risk: High/Medium
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            <button className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors">
              Category: Electronics
            </button>
            <button className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors">
              Time Range: Last 24h
            </button>
          </div>

          <div className="flex items-center gap-4 ml-auto pl-4 border-l border-slate-200">
            <span className="text-slate-500 text-xs font-semibold">SELECTED: <span className="text-orange-600 font-bold">{selectedCount}</span></span>
            <button 
              onClick={() => setSelectedItems({})}
              className="text-slate-400 hover:text-red-650 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              <span className="text-xs font-semibold">CLEAR</span>
            </button>
          </div>
        </div>
      </div>

      {/* High Density Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-700">
                <th className="p-3 w-12 text-center">
                  <input 
                    className="rounded-sm border-slate-350 text-orange-500 accent-orange-500" 
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredReturns.length > 0 && filteredReturns.every(item => selectedItems[item.id])}
                  />
                </th>
                <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Item / ID</th>
                <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Flag Reason</th>
                <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">AI Grade</th>
                <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Agent Grade</th>
                <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Account Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredReturns.map((item) => {
                const isChecked = !!selectedItems[item.id];
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                      isChecked ? 'bg-orange-50/30' : 'even:bg-slate-50/10'
                    }`}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        className="rounded-sm border-slate-350 text-orange-500 accent-orange-500" 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="p-3" onClick={() => onSelectCase(item.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5">
                          <img className="w-full h-full object-contain" alt={item.itemName} src={item.imgUrl} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm font-mono">{item.id}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.category || 'ELECTRONICS'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3" onClick={() => onSelectCase(item.id)}>
                      <span className="font-mono text-slate-700 text-xs">{item.customerName}</span>
                    </td>
                    <td className="p-3" onClick={() => onSelectCase(item.id)}>
                      <span className="bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                        {item.flagReason || 'Stage 1/2 Disagreement'}
                      </span>
                    </td>
                    <td className="p-3" onClick={() => onSelectCase(item.id)}>
                      {renderGradePill(item.userGrade)}
                    </td>
                    <td className="p-3" onClick={() => onSelectCase(item.id)}>
                      {renderGradePill(item.agentGrade)}
                    </td>
                    <td className="p-3" onClick={() => onSelectCase(item.id)}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.riskTier === 'Critical Risk' 
                          ? 'bg-red-600 text-white' 
                          : item.riskTier === 'Medium Risk' || item.riskTier === 'Elevated'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-500 text-white'
                      }`}>
                        {item.riskTier === 'Critical Risk' ? 'CRITICAL RISK' : item.riskTier === 'Medium Risk' || item.riskTier === 'Elevated' ? 'MEDIUM RISK' : 'LOW RISK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination/Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center text-slate-500">
          <div className="flex items-center gap-3">
            <span className="text-xs">Showing 1-{filteredReturns.length} of 248 entries</span>
            <div className="relative">
              <select className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none appearance-none pr-8 cursor-pointer font-medium hover:border-slate-300 transition-colors">
                <option>50 per page</option>
                <option>10 per page</option>
                <option>25 per page</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-slate-400">expand_more</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button className="p-1 rounded hover:bg-slate-100 text-slate-400 cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-orange-500 text-orange-600 rounded-lg font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-650 rounded-lg cursor-pointer">2</button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-650 rounded-lg cursor-pointer">3</button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-650 rounded-lg cursor-pointer">5</button>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

