import React from 'react';

export default function TaskList({ returns, onSelectTask }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-[#E3F2FD] text-[#0D47A1]';
      case 'Completed':
        return 'bg-[#E8F5E9] text-[#2E7D32]';
      case 'In Review':
        return 'bg-[#FFF3E0] text-[#E65100]';
      case 'Approved':
        return 'bg-[#E8F5E9] text-[#1B5E20]';
      default: // 'Pending'
        return 'bg-[#F5F5F5] text-[#424242]';
    }
  };

  // Only returns the customer has actually requested show up as pickup
  // tasks — plain 'Pending' means the order is still just eligible, no
  // return has been initiated yet.
  const requestedReturns = returns.filter((r) => r.status !== 'Pending');

  // Sort returns: In Progress first, then Approved/In Review, then Completed
  const sortedTasks = [...requestedReturns].sort((a, b) => {
    const score = { 'In Progress': 4, 'Approved': 3, 'In Review': 3, 'Completed': 1 };
    return (score[b.status] ?? 2) - (score[a.status] ?? 2);
  });

  return (
    <div className="w-full text-left">
      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2 font-bold">Today's Pickups</h2>
        <p className="font-body-md text-on-surface-variant">Scheduled for Wednesday, May 22</p>
      </section>

      {/* Pickup Task List */}
      <div className="flex flex-col gap-stack-md">
        {sortedTasks.map((task) => {
          const isCompleted = task.status === 'Completed';
          return (
            <button
              key={task.id}
              disabled={isCompleted}
              onClick={() => onSelectTask(task.id)}
              className={`w-full text-left bg-white border p-4 rounded-xl transition-all duration-150 flex flex-col gap-4 min-h-[140px] group ${
                isCompleted 
                  ? 'bg-surface-container-low border-outline-variant opacity-80 cursor-default' 
                  : 'border-outline-variant hover:border-primary-container active:bg-surface-container-highest cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full font-headline-md font-semibold ${
                    isCompleted ? 'bg-surface-dim text-on-surface-variant' : 'bg-primary-container text-white'
                  }`}>
                    {getInitials(task.customerName)}
                  </div>
                  <div>
                    <p className={`font-label-lg font-bold ${isCompleted ? 'text-on-surface-variant' : 'text-primary'}`}>
                      {task.customerName}
                    </p>
                    <p className="font-label-md text-on-surface-variant text-xs">{task.timeWindow}</p>
                  </div>
                </div>
                <span className={`status-chip text-[10px] font-bold py-1 px-3 rounded uppercase tracking-wider ${getStatusClasses(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <div className="flex gap-4 items-center w-full">
                <img 
                  className={`w-16 h-16 rounded-lg object-cover bg-surface-container border border-outline-variant ${
                    isCompleted ? 'grayscale opacity-50' : ''
                  }`} 
                  alt={task.itemName} 
                  src={task.imgUrl} 
                />
                <div className="flex-grow">
                  <p className={`font-body-md font-semibold leading-tight ${isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                    {task.address}
                  </p>
                  <p className="font-label-md text-on-surface-variant text-[11px] uppercase tracking-wide">{task.district}</p>
                </div>
                {!isCompleted && (
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                )}
                {isCompleted && (
                  <span className="material-symbols-outlined text-[#2E7D32]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
