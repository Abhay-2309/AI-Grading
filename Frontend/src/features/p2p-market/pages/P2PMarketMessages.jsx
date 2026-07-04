import React, { useState, useEffect, useMemo, useRef } from 'react';
import LocationPill from '../components/LocationPill';

export default function P2PMarketMessages({
  p2pChats,
  onSendMessage,
  activeChatId: propActiveChatId,
  userLocation,
  onDetectLocation,
  onNavigate,
  onExit
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'buying', 'selling', 'archived'
  const [selectedChatId, setSelectedChatId] = useState(propActiveChatId || p2pChats[0]?.id);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef(null);

  // Sync activeChatId if changed from parent (e.g. when starting a chat from details page)
  useEffect(() => {
    if (propActiveChatId) {
      setSelectedChatId(propActiveChatId);
    }
  }, [propActiveChatId]);

  // Find active chat object
  const activeChat = useMemo(() => {
    return p2pChats.find(c => c.id === selectedChatId) || p2pChats[0];
  }, [p2pChats, selectedChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // Filter conversations list by active category tab
  const filteredChats = useMemo(() => {
    return p2pChats.filter(chat => {
      if (activeTab === 'all') return true;
      return chat.category === activeTab;
    });
  }, [p2pChats, activeTab]);

  const handleSend = () => {
    if (typedMessage.trim() === '' || !activeChat) return;
    onSendMessage(activeChat.id, typedMessage);
    setTypedMessage('');
  };

  const handleSuggestionClick = (text) => {
    if (!activeChat) return;
    onSendMessage(activeChat.id, text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  return (
    <div className="bg-slate-100 text-slate-900 h-screen flex flex-col font-sans antialiased overflow-hidden">
      {/* TopNavBar */}
      <header className="bg-[#232F3E] text-white sticky top-0 z-50 shadow-md shrink-0">
        {/* Upper Bar */}
        <div className="flex justify-between items-center w-full px-6 py-2.5 gap-6 max-w-[1440px] mx-auto">
          {/* Brand Logo */}
          <button 
            onClick={() => onNavigate('home')} 
            className="text-xl md:text-2xl font-black text-white hover:text-orange-400 transition-colors bg-transparent border-none cursor-pointer focus:outline-none shrink-0"
          >
            MarketConnect
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-grow max-w-2xl">
            <div className="flex items-center">
              <input
                className="w-full bg-white border-none rounded-l-md py-2 px-4 text-xs focus:outline-none text-slate-900 placeholder-slate-500"
                placeholder="Search for anything..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-[#febd69] hover:bg-[#f3a847] text-[#111111] px-5 py-2.5 rounded-r-md flex items-center justify-center transition-colors border-none cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[#111111] text-[18px]">search</span>
              </button>
            </div>
          </form>

          {/* Actions Cluster */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Location */}
            <LocationPill userLocation={userLocation} onDetectLocation={onDetectLocation} />

            {/* Hello, Sign in */}
            <div className="hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all">
              <span className="text-[10px] opacity-75">Hello, Sign in</span>
              <span className="text-xs font-bold">Account & Lists</span>
            </div>

            {/* Returns & Orders */}
            <button 
              onClick={() => onNavigate('home')}
              className="bg-transparent border-none text-white hidden md:flex flex-col items-start leading-tight cursor-pointer hover:border hover:border-white p-1 rounded transition-all text-left focus:outline-none"
            >
              <span className="text-[10px] opacity-75">Returns</span>
              <span className="text-xs font-bold">& Orders</span>
            </button>

            {/* Chat Link */}
            <button 
              onClick={() => onNavigate('messages')}
              className="bg-transparent border-none text-white flex flex-col items-center cursor-pointer hover:text-orange-400 transition-all focus:outline-none p-1"
            >
              <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
              <span className="text-[10px] font-bold mt-0.5">Chat</span>
            </button>

            {/* User Profile Avatar */}
            <div className="w-9 h-9 rounded-full border-2 border-[#febd69] overflow-hidden shrink-0 cursor-pointer">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT9c2SyWdJm1WQnazqi8D3rkYonHWiVxVV2SRGPXh3UyIC0lShKamMfyOxom6kPDdDmYlgIFcCsKixg28TjNyZYvf3CUUMsfqSxOMqnzpXmDT9uihEX8H2aEcSrlv-C6LVLmwpOyRm5KtYb0-hTwZKEeeOFvYQivBnkOALPM759biUUjfax6Vck7rzyqTTKOb6nQ0FAfl4Ml32tIj6BKontw1nnEOCh6FfCb-evQVOY8sg7ToqfAly7Q" 
                alt="Profile Avatar" 
              />
            </div>

            {/* Sell Pill Button */}
            <button 
              onClick={() => onNavigate('sell')}
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-600 p-[2px] rounded-full hover:scale-105 transition-all cursor-pointer border-none shadow"
            >
              <div className="bg-white rounded-full px-4 py-1 flex items-center justify-center gap-1">
                <span className="text-base font-black text-[#0f3b8c] leading-none">+</span>
                <span className="text-xs font-black text-[#0f3b8c] tracking-wider leading-none">SELL</span>
              </div>
            </button>

            {/* Exit Portal */}
            <button 
              onClick={onExit}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer border-none shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Exit
            </button>
          </div>
        </div>

        {/* Lower Navigation links (Light Grey bg) */}
        <div className="bg-[#eaeded] border-b border-slate-200 py-1.5 text-slate-700">
          <div className="max-w-[1440px] mx-auto flex items-center gap-6 px-6 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 text-slate-800 font-bold hover:text-orange-600 text-xs bg-transparent border-none cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">menu</span> All
            </button>
            <nav className="flex items-center gap-6 whitespace-nowrap text-xs">
              {[
                { label: 'Deals', catValue: 'All' },
                { label: 'Groceries', catValue: 'Groceries' },
                { label: 'Fashion', catValue: 'Fashion' },
                { label: 'Electronics', catValue: 'Electronics' },
                { label: 'Home', catValue: 'Furniture' },
                { label: 'Sports', catValue: 'Photography' }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate('search', { category: item.catValue })}
                  className="font-bold transition-colors cursor-pointer bg-transparent border-none focus:outline-none pb-0.5 text-slate-650 hover:text-orange-600"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar Messages List */}
        <aside className="bg-white border-r border-slate-200 w-80 flex flex-col h-full overflow-hidden shrink-0 text-left">
          <div className="p-4 border-b border-slate-200 space-y-4 shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-md font-extrabold text-slate-800">Inbox</h2>
            </div>
            
            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Messages' },
                { id: 'buying', label: 'Buying' },
                { id: 'selling', label: 'Selling' },
                { id: 'archived', label: 'Archived' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border-none cursor-pointer focus:outline-none ${
                    activeTab === tab.id 
                      ? 'bg-[#232F3E] text-white' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredChats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-orange-50/70 border-l-4 border-orange-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img className="w-10 h-10 rounded-full object-cover bg-slate-100" alt="Avatar" src={chat.senderImg} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline gap-1">
                      <h3 className="font-bold text-xs text-slate-800 truncate">{chat.sender}</h3>
                      <span className="text-[9px] text-slate-400 shrink-0">{lastMsg?.time || '10:00 AM'}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-orange-950 font-medium' : 'text-slate-500'}`}>
                      {lastMsg?.text || 'No messages yet'}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 capitalize">
                      <span className="material-symbols-outlined text-[12px] opacity-75">
                        {chat.category === 'selling' ? 'storefront' : 'shopping_cart'}
                      </span>
                      <span>{chat.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredChats.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <span className="material-symbols-outlined text-[32px] opacity-50">forum</span>
                <p>No conversations found</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <section className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden text-left">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <header className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img className="w-10 h-10 rounded-full object-cover bg-slate-100" alt={activeChat.sender} src={activeChat.senderImg} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-850">{activeChat.sender}</h2>
                    <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online now
                    </p>
                  </div>
                </div>

                {/* Context Product Card */}
                {activeChat.item && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center gap-3 max-w-xs text-left">
                    <img className="w-10 h-10 rounded object-cover bg-slate-100 shrink-0" alt="Context Item" src={activeChat.item.image} />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-[10px] font-bold text-slate-700 truncate">{activeChat.item.title}</h4>
                      <p className="text-orange-600 font-extrabold text-[11px] mt-0.5">₹{activeChat.item.price}</p>
                    </div>
                  </div>
                )}
              </header>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                <div className="flex justify-center">
                  <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Today
                  </span>
                </div>

                {activeChat.messages.map((msg, idx) => {
                  const isMe = msg.isMe;
                  return (
                    <div key={idx} className={`flex items-start gap-2.5 max-w-[80%] ${isMe ? 'self-end flex-row-reverse ml-auto' : ''}`}>
                      {!isMe && (
                        <img className="w-7 h-7 rounded-full object-cover bg-slate-100 mt-1" alt={activeChat.sender} src={activeChat.senderImg} />
                      )}
                      <div className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-xl shadow-sm text-xs border ${
                          isMe 
                            ? 'bg-[#232F3E] text-white border-[#232F3E] rounded-tr-none' 
                            : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-slate-400">
                          <span>{msg.time}</span>
                          {isMe && (
                            <span className="material-symbols-outlined text-[14px] text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                              done_all
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Footer Input & Suggestion Chips */}
              <footer className="p-4 bg-white border-t border-slate-200 shrink-0">
                {/* Suggestion Chips */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    'Is this available?',
                    "What's the final price?",
                    'Can we meet today?',
                    "I'm interested!"
                  ].map(chip => (
                    <button 
                      key={chip}
                      type="button"
                      onClick={() => handleSuggestionClick(chip)}
                      className="border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-500 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 transition-all whitespace-nowrap cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input block */}
                <div className="flex items-center gap-3">
                  <button className="material-symbols-outlined text-[#232F3E] p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer bg-transparent border-none">
                    attach_file
                  </button>
                  <button className="material-symbols-outlined text-[#232F3E] p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer bg-transparent border-none">
                    image
                  </button>
                  
                  <div className="flex-grow">
                    <textarea 
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800 resize-none" 
                      placeholder="Type a message..." 
                      rows="1"
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                    ></textarea>
                  </div>
                  
                  <button 
                    onClick={handleSend}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-orange-600 transition-colors border-none cursor-pointer active:scale-95 shadow"
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-12 text-center text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-[64px] opacity-40">chat_bubble</span>
              <h3 className="text-base font-bold text-slate-700">No active conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">Select a contact from the sidebar list to start chatting.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
