import { useState, useEffect, useCallback } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: isFormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Backend's own errors are a plain string (`{ error: 'message' }`), but
    // AI1's are proxied through verbatim and shape `error` as an object
    // (`{ error: { code, message, details } }`) — handle both instead of
    // letting the object one stringify to "[object Object]".
    const errMessage = typeof data?.error === 'string' ? data.error : data?.error?.message;
    throw new Error(errMessage || data?.failureReason || `Request failed: ${res.status}`);
  }
  return data;
}

const json = (obj) => JSON.stringify(obj);

const INITIAL_RETURN_STATE = {
  itemId: 'ITEM-88291-ZX', // Sony Camera
  reason: '',
  comments: '',
  subcategory: null,
  conditionAnswers: {},
  photos: [],
  aiReport: null,
  assessmentComplete: false,
  method: 'dropoff', // 'dropoff', 'ups'
  mockIp: null,
};

export function useGlobalState() {
  const [returns, setReturns] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [p2pProducts, setP2pProducts] = useState([]);
  const [p2pChats, setP2pChats] = useState([]);
  const [donationCampaigns, setDonationCampaigns] = useState([]);
  const [greenCredits, setGreenCredits] = useState(0);
  const [donationHistory, setDonationHistory] = useState([]);
  const [impactStats, setImpactStats] = useState({ treesPlanted: 0, causesHelped: 0 });
  const [subcategoryTaxonomy, setSubcategoryTaxonomy] = useState({});
  const [currentReturnState, setCurrentReturnState] = useState(INITIAL_RETURN_STATE);
  const [userLocation, setUserLocation] = useState({
    status: 'idle', // 'idle' | 'locating' | 'done' | 'error'
    lat: null,
    lng: null,
    label: 'India',
    error: null,
  });

  useEffect(() => {
    const fetchReturns = () => {
      apiFetch('/api/returns')
        .then(setReturns)
        .catch((err) => console.error('Failed to load returns:', err));
    };

    fetchReturns();
    const interval = setInterval(fetchReturns, 3000);

    apiFetch('/api/profile/leaderboard').then(setLeaderboard).catch((err) => console.error('Failed to load leaderboard:', err));
    apiFetch('/api/p2p/products').then(setP2pProducts).catch((err) => console.error('Failed to load p2p products:', err));
    apiFetch('/api/p2p/chats').then(setP2pChats).catch((err) => console.error('Failed to load p2p chats:', err));
    apiFetch('/api/donations/campaigns').then(setDonationCampaigns).catch((err) => console.error('Failed to load campaigns:', err));
    apiFetch('/api/config/subcategories').then(setSubcategoryTaxonomy).catch((err) => console.error('Failed to load subcategory taxonomy:', err));
    apiFetch('/api/profile')
      .then((profile) => {
        setGreenCredits(profile.greenCredits);
        setImpactStats(profile.impactStats);
        setDonationHistory(profile.donationHistory);
      })
      .catch((err) => console.error('Failed to load profile:', err));

    return () => clearInterval(interval);
  }, []);

  // Update return record status or details
  const updateReturn = useCallback((id, fields) => {
    apiFetch(`/api/returns/${id}`, { method: 'PUT', body: json(fields) })
      .then((updated) => setReturns((prev) => prev.map((item) => (item.id === id ? updated : item))))
      .catch((err) => console.error('Failed to update return:', err));
  }, []);

  // Submit new return from User Dashboard flow. userGrade/userConfidence/
  // defects are NOT sent here — grading.js's /result handler already
  // persisted the real AI grade; resending a stale placeholder from here
  // would clobber it.
  const submitUserReturn = useCallback(() => {
    setCurrentReturnState((state) => {
      const { itemId, reason, comments, subcategory, conditionAnswers, mockIp } = state;
      apiFetch('/api/returns/submit', {
        method: 'POST',
        body: json({ itemId, reason, comments, subcategory, conditionAnswers, mockIp }),
      })
        .then((updated) => setReturns((prev) => prev.map((item) => (item.id === itemId ? updated : item))))
        .catch((err) => console.error('Failed to submit return:', err));
      return state;
    });
  }, []);

  const resetReturnFlow = useCallback(() => {
    setCurrentReturnState(INITIAL_RETURN_STATE);
  }, []);

  // Async — returns a Promise<product>. Throws (caller must catch) on
  // insufficient green credits or other failures, so the Sell flow can show
  // a real error instead of silently swallowing it.
  const addP2PProduct = useCallback((product) => {
    const { seller, id: _clientId, ...rest } = product;
    return apiFetch('/api/p2p/products', { method: 'POST', body: json({ ...rest, sellerName: seller }) })
      .then((created) => {
        const { greenCredits: gc, ...mapped } = created;
        setP2pProducts((prev) => [mapped, ...prev]);
        if (gc !== undefined) setGreenCredits(gc);
        return mapped;
      });
  }, []);

  // Async — returns a Promise<string> (the phone number). Throws on
  // insufficient green credits so the caller can show a real error.
  const revealSellerPhone = useCallback((productId) => {
    return apiFetch(`/api/p2p/products/${productId}/reveal-phone`, { method: 'POST' })
      .then(({ phone, greenCredits: gc }) => {
        setGreenCredits(gc);
        return phone;
      });
  }, []);

  // Real browser geolocation, reverse-geocoded to a place name so the
  // navbar shows something readable instead of raw coordinates. Falls back
  // to coordinates if reverse geocoding is unreachable.
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserLocation((prev) => ({ ...prev, status: 'error', error: 'Geolocation is not supported by this browser.' }));
      return;
    }
    setUserLocation((prev) => ({ ...prev, status: 'locating', error: null }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let label = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            label = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state || label;
          }
        } catch {
          // Reverse geocoding is best-effort only — coordinates still work for distance sorting.
        }
        setUserLocation({ status: 'done', lat: latitude, lng: longitude, label, error: null });
      },
      (err) => {
        setUserLocation((prev) => ({
          ...prev,
          status: 'error',
          error: err.code === err.PERMISSION_DENIED ? 'Location permission denied.' : 'Failed to detect your location.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const sendP2PMessage = useCallback((chatId, text) => {
    apiFetch(`/api/p2p/chats/${chatId}/messages`, { method: 'POST', body: json({ text }) })
      .then((message) => {
        setP2pChats((prev) =>
          prev.map((chat) => (chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat))
        );
      })
      .catch((err) => console.error('Failed to send message:', err));
  }, []);

  // Async — returns a Promise<chatId>. Callers must await it.
  const startP2PChat = useCallback((sellerName, senderImg, itemTitle, itemPrice, itemImage) => {
    return apiFetch('/api/p2p/chats', {
      method: 'POST',
      body: json({ sellerName, senderImg, itemTitle, itemPrice, itemImage }),
    })
      .then((chat) => {
        setP2pChats((prev) => (prev.some((c) => c.id === chat.id) ? prev : [chat, ...prev]));
        return chat.id;
      })
      .catch((err) => {
        console.error('Failed to start chat:', err);
        return null;
      });
  }, []);

  // Donation mutations
  const donateToCampaign = useCallback((campaignId, itemCategory, qty) => {
    apiFetch('/api/donations/donate', { method: 'POST', body: json({ campaignId, itemCategory, qty }) })
      .then(({ greenCredits: gc, impactStats: stats, donationCampaigns: campaigns, donationHistory: history }) => {
        setGreenCredits(gc);
        setImpactStats(stats);
        setDonationCampaigns(campaigns);
        setDonationHistory(history);
      })
      .catch((err) => console.error('Failed to donate:', err));
  }, []);

  // Async — returns a Promise<campaign>. Throws on failure so the caller
  // can show a real error instead of silently closing the form.
  const addCampaignNeed = useCallback((campaign) => {
    const { id: _clientId, progress: _p, received: _r, ...rest } = campaign;
    return apiFetch('/api/donations/campaigns/need', { method: 'POST', body: json(rest) })
      .then((created) => {
        setDonationCampaigns((prev) => [created, ...prev]);
        return created;
      });
  }, []);

  // Async — returns a Promise<campaign>. Used by the NGO Hub's "Edit Need".
  const updateCampaignNeed = useCallback((id, fields) => {
    return apiFetch(`/api/donations/campaigns/${id}`, { method: 'PATCH', body: json(fields) })
      .then((updated) => {
        setDonationCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      });
  }, []);

  // Async — returns a Promise<boolean>. Callers must await it.
  const redeemCredits = useCallback((tierCredits, perkTitle) => {
    return apiFetch('/api/donations/redeem', { method: 'POST', body: json({ tierCredits, perkTitle }) })
      .then(({ greenCredits: gc, donationHistory: history }) => {
        setGreenCredits(gc);
        setDonationHistory(history);
        return true;
      })
      .catch((err) => {
        console.error('Failed to redeem credits:', err);
        return false;
      });
  }, []);

  return {
    returns,
    leaderboard,
    subcategoryTaxonomy,
    currentReturnState,
    setCurrentReturnState,
    updateReturn,
    submitUserReturn,
    resetReturnFlow,
    p2pProducts,
    p2pChats,
    addP2PProduct,
    revealSellerPhone,
    sendP2PMessage,
    startP2PChat,
    userLocation,
    detectUserLocation,
    donationCampaigns,
    greenCredits,
    donationHistory,
    impactStats,
    donateToCampaign,
    addCampaignNeed,
    updateCampaignNeed,
    redeemCredits,
  };
}

export { API_BASE, apiFetch };
