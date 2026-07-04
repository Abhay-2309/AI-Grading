import React, { useState } from 'react';
import { formatINR } from '../../../services/currency';

// Status badge colours
const statusColour = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-green-100 text-green-700',
  'In Review': 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
};

// How many days ago to show for demo orders
const DEMO_ORDERS = [
  { daysAgo: 3,  orderId: 'ORD-293810' },
  { daysAgo: 12, orderId: 'ORD-119456' },
  { daysAgo: 27, orderId: 'ORD-884201' },
  { daysAgo: 45, orderId: 'ORD-672391' },
];

function orderedDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OrderList({ returns = [], onSelectItem, onExit }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  // Map returns to order-like objects with demo data sprinkled in
  const orders = returns.map((r, idx) => ({
    ...r,
    orderId: DEMO_ORDERS[idx % DEMO_ORDERS.length].orderId,
    orderedOn: orderedDate(DEMO_ORDERS[idx % DEMO_ORDERS.length].daysAgo),
    deliveredOn: orderedDate(Math.max(1, DEMO_ORDERS[idx % DEMO_ORDERS.length].daysAgo - 5)),
    // Only orders with no return in flight yet are returnable — once a
    // return is submitted, status moves to 'Approved'/'In Review'/'Completed'
    // and the item should no longer offer "Return Item" again.
    returnEligible: r.status === 'Pending' || !r.status,
    displayStatus: r.status || 'Delivered',
  }));

  const statuses = ['All', ...new Set(orders.map(o => o.displayStatus))];

  const filtered = orders.filter(o => {
    const matchSearch =
      search === '' ||
      o.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      o.orderId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || o.displayStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface leading-tight">Your Orders</h1>
          <p className="text-xs text-on-surface-variant mt-1">Select an item to start a return</p>
        </div>
        <button
          onClick={onExit}
          className="self-start sm:self-center text-xs font-bold text-on-surface/60 hover:text-on-surface flex items-center gap-1 bg-transparent border-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          Back to Portal
        </button>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-grow flex items-center bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px] px-3">search</span>
          <input
            className="flex-grow py-2.5 text-sm text-on-surface bg-transparent border-none outline-none placeholder-on-surface-variant/50"
            placeholder="Search by item name or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-3 text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <select
          className="bg-white border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none cursor-pointer shadow-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          {statuses.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-on-surface-variant -mt-3">
        Showing <strong>{filtered.length}</strong> of <strong>{orders.length}</strong> orders
      </p>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-xl p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant">inventory_2</span>
          <p className="text-sm font-bold text-on-surface">No orders found</p>
          <p className="text-xs text-on-surface-variant">Try a different search term or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isHovered = hoveredId === order.id;
            const chipColour = statusColour[order.displayStatus] || 'bg-slate-100 text-slate-600';

            return (
              <div
                key={order.id}
                onMouseEnter={() => setHoveredId(order.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                  isHovered ? 'border-secondary-container shadow-md -translate-y-0.5' : 'border-outline-variant'
                }`}
              >
                {/* Order meta bar */}
                <div className="bg-surface-container-lowest border-b border-outline-variant px-5 py-2.5 flex flex-wrap gap-x-6 gap-y-1 items-center justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <span>ORDER PLACED <span className="text-on-surface normal-case">{order.orderedOn}</span></span>
                    <span>DELIVERED <span className="text-on-surface normal-case">{order.deliveredOn}</span></span>
                    <span>ORDER # <span className="text-on-surface font-mono normal-case">{order.orderId}</span></span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${chipColour}`}>
                    {order.displayStatus}
                  </span>
                </div>

                {/* Item body */}
                <div className="p-5 flex gap-4 items-center">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg border border-outline-variant overflow-hidden bg-surface-container-lowest shrink-0 flex items-center justify-center">
                    {order.imgUrl ? (
                      <img src={order.imgUrl} alt={order.itemName} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant">image</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-sm text-on-surface leading-snug line-clamp-2">{order.itemName}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{order.category}</p>
                    <p className="text-base font-black text-secondary mt-1">{formatINR(order.price)}</p>
                    {order.userGrade && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5">
                        AI Grade: {order.userGrade}
                      </span>
                    )}
                  </div>

                  {/* Return CTA */}
                  <div className="shrink-0 flex flex-col items-end gap-2 ml-2">
                    {order.returnEligible ? (
                      <button
                        onClick={() => onSelectItem(order.id)}
                        className="bg-secondary-container text-on-secondary-fixed hover:opacity-90 font-bold text-xs px-4 py-2.5 rounded-lg transition-all active:scale-[0.97] cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">undo</span>
                        Return Item
                      </button>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">
                          {['Approved', 'In Review', 'Completed'].includes(order.displayStatus) ? 'schedule' : 'block'}
                        </span>
                        {order.displayStatus === 'Approved'
                          ? 'Return submitted'
                          : order.displayStatus === 'In Review'
                          ? 'Under review'
                          : order.displayStatus === 'Completed'
                          ? 'Return complete'
                          : 'Not eligible'}
                      </span>
                    )}
                    <button className="text-[10px] text-secondary font-bold hover:underline bg-transparent border-none cursor-pointer flex items-center gap-0.5">
                      View details
                      <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
