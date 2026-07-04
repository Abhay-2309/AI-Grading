import React from 'react';

// Smart routing table: where a completed return's final grade sends it.
const ROUTING_DESTINATIONS = ['Resale', 'Renewed', 'Donation', 'Liquidation'];

export default function RoutingBoard({ returns, onSelectCase, searchQuery = '' }) {
  // Only returns that have actually reached a routing decision belong on
  // this board — i.e. status Completed with a routing value computed by
  // the backend from the final grade (see Backend/utils/routing.js).
  const routedReturns = returns.filter((item) => item.routing);

  const filteredReturns = routedReturns.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const routingCounts = ROUTING_DESTINATIONS.reduce((acc, dest) => {
    acc[dest] = routedReturns.filter((item) => item.routing === dest).length;
    return acc;
  }, {});
  const manualReviewCount = routedReturns.filter((item) => item.routing === 'Manual Review').length;

  const getDecisionButton = (item) => {
    if (item.routing === 'Manual Review') {
      return (
        <button
          onClick={() => onSelectCase(item.id)}
          className="bg-[#ffa726] hover:bg-[#fb8c00] text-slate-950 font-bold text-xs px-3 py-1.5 rounded-md shadow-sm w-full text-center uppercase cursor-pointer"
        >
          Manual Review
        </button>
      );
    }

    return (
      <button
        onClick={() => onSelectCase(item.id)}
        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-3 py-1.5 rounded-md w-full text-center uppercase cursor-pointer"
      >
        {item.routing}
      </button>
    );
  };

  return (
    <div className="flex-1 flex min-h-0 text-left overflow-hidden">
      {/* Left Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
        
        {/* Filters & Sync Header */}
        <div className="flex justify-between items-center mb-6 w-full">
          <div className="flex gap-2">
            <button className="bg-[#ffa726] text-slate-950 px-3.5 py-1.5 rounded-md font-semibold text-xs cursor-pointer">Live View</button>
            <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors">Past 24h</button>
            <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors">Electronics</button>
            <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors">High Risk</button>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">LAST SYNCED: 14:22:09 UTC</div>
        </div>

        {/* Metric Cards Row — live counts from the returns actually routed by AI grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {/* Card 1: Resale (Grade A+/A) */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resale</span>
              <span className="material-symbols-outlined text-slate-500 text-base">storefront</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">{routingCounts.Resale}</div>
            <div className="text-[10px] text-slate-450 font-semibold mt-1">Grade A+ / A</div>
          </div>
          {/* Card 2: Renewed (Grade B+/B) */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Renewed</span>
              <span className="material-symbols-outlined text-slate-500 text-base">cached</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">{routingCounts.Renewed}</div>
            <div className="text-[10px] text-slate-450 font-semibold mt-1">Grade B+ / B</div>
          </div>
          {/* Card 3: Donation (Grade C) */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Donation</span>
              <span className="material-symbols-outlined text-slate-500 text-base">volunteer_activism</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">{routingCounts.Donation}</div>
            <div className="text-[10px] text-slate-450 font-semibold mt-1">Grade C</div>
          </div>
          {/* Card 4: Liquidation (Grade D/F) */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Liquidation</span>
              <span className="material-symbols-outlined text-slate-500 text-base">delete</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">{routingCounts.Liquidation}</div>
            <div className="text-[10px] text-slate-450 font-semibold mt-1">Grade D / F</div>
          </div>
          {/* Card 5: Manual Review (Highlighted) */}
          <div className={`bg-white p-4 rounded-xl relative shadow-sm ${manualReviewCount > 0 ? 'border-2 border-orange-500' : 'border border-slate-200'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${manualReviewCount > 0 ? 'text-orange-500' : 'text-slate-400'}`}>Manual Review</span>
              <span className={`material-symbols-outlined text-base ${manualReviewCount > 0 ? 'text-orange-500' : 'text-slate-500'}`}>warning</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${manualReviewCount > 0 ? 'text-orange-550' : 'text-slate-800'}`}>{manualReviewCount}</div>
            <div className={`text-[10px] font-bold mt-1 ${manualReviewCount > 0 ? 'text-orange-550' : 'text-slate-450 font-semibold'}`}>
              {manualReviewCount > 0 ? 'Action Required' : 'All clear'}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 font-bold">
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Return ID</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">AI Grade</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Agent</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Verify</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center w-48">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredReturns.map((item) => {
                  const isMismatch = item.routing === 'Manual Review';

                  // Grade pill styling
                  const getGradePill = (grade, forceRed = false) => {
                    if (!grade) return <span className="text-slate-400 italic text-xs">Pending</span>;
                    if (forceRed) {
                      return (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase font-mono">
                          {grade}
                        </span>
                      );
                    }
                    if (grade.toUpperCase().includes('A')) {
                      return (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase font-mono">
                          {grade}
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-650 border border-slate-200 uppercase font-mono">
                        {grade}
                      </span>
                    );
                  };

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 transition-colors border-l-4 ${
                        isMismatch
                          ? 'bg-red-50/40 hover:bg-red-100/20 border-l-red-500'
                          : 'border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5">
                          <img className="w-full h-full object-contain" alt={item.itemName} src={item.imgUrl} />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{item.itemName}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-650">{item.id}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 italic">"{item.reason}"</td>
                      <td className="px-4 py-3.5 text-center">{getGradePill(item.userGrade)}</td>
                      <td className="px-4 py-3.5 text-center">{getGradePill(item.agentGrade, isMismatch)}</td>
                      <td className="px-4 py-3.5 text-center">
                        {item.agentGrade ? (
                          isMismatch ? (
                            <span className="inline-flex w-5 h-5 rounded-full bg-red-600 text-white font-bold items-center justify-center text-xs">!</span>
                          ) : (
                            <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                          )
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-lg">pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{getDecisionButton(item)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right docked sidebar component */}
      <div className="w-16 bg-[#162235] border-l border-[#1e2d44] flex flex-col justify-between items-center py-6 shrink-0 h-full">
        <div className="flex flex-col gap-6 items-center w-full">
          {/* RECV */}
          <div className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="text-[9px] font-bold">RECV</span>
          </div>
          {/* VRFY */}
          <div className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span className="text-[9px] font-bold">VRFY</span>
          </div>
          {/* AUTO */}
          <div className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            <span className="text-[9px] font-bold">AUTO</span>
          </div>
          {/* MANL */}
          <div className="relative flex flex-col items-center gap-1 cursor-pointer bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-1.5 rounded-lg w-12">
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="text-[9px] font-bold">MANL</span>
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-slate-950 font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
              18
            </span>
          </div>
        </div>
        
        {/* + Button */}
        <button className="bg-[#ffa726] hover:bg-[#fb8c00] text-slate-950 w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-sm">
          <span className="material-symbols-outlined font-bold text-lg">add</span>
        </button>
      </div>
    </div>
  );
}

