import React from 'react';

// Navbar "Deliver to" control shared across every MarketConnect page —
// clicking it triggers real browser geolocation instead of the static
// "India" label it used to show.
export default function LocationPill({ userLocation, onDetectLocation }) {
  const status = userLocation?.status || 'idle';
  const isLocating = status === 'locating';

  const label =
    status === 'locating' ? 'Locating...' :
    status === 'error' ? 'Set location' :
    status === 'done' ? userLocation.label :
    'India';

  return (
    <button
      type="button"
      onClick={onDetectLocation}
      disabled={isLocating}
      title={status === 'error' ? userLocation.error : 'Detect my current location'}
      className="hidden lg:flex items-center gap-1.5 cursor-pointer hover:border hover:border-white p-1 rounded transition-all bg-transparent border border-transparent text-white disabled:cursor-wait"
    >
      <span className={`material-symbols-outlined text-[18px] text-white ${isLocating ? 'animate-spin' : ''}`}>
        {isLocating ? 'progress_activity' : status === 'error' ? 'location_off' : 'location_on'}
      </span>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] opacity-75">Deliver to</span>
        <span className="text-xs font-bold">{label}</span>
      </div>
    </button>
  );
}
