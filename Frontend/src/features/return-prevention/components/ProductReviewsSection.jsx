import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../../services/api';

export default function ProductReviewsSection({ productId }) {
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isHowCalculatedOpen, setIsHowCalculatedOpen] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState({}); // { reviewId: true }

  const carouselRef = useRef(null);

  // Fetch reviews data
  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/products/${productId}/reviews?page=1&limit=6`)
      .then(data => {
        setReviewsData(data);
        setReviewsList(data.reviews || []);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
        setLoading(false);
      });
  }, [productId]);

  // Load more reviews (pagination)
  const handleLoadMore = () => {
    if (!reviewsData?.hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    apiFetch(`/api/products/${productId}/reviews?page=${nextPage}&limit=6`)
      .then(data => {
        setReviewsData(data);
        setReviewsList(prev => [...prev, ...(data.reviews || [])]);
        setCurrentPage(nextPage);
        setLoadingMore(false);
      })
      .catch(err => {
        console.error('Error loading more reviews:', err);
        setLoadingMore(false);
      });
  };

  // Carousel scroll handler
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Increment helpful count on UI click
  const handleHelpfulClick = (reviewId) => {
    if (helpfulClicked[reviewId]) return;
    setHelpfulClicked(prev => ({ ...prev, [reviewId]: true }));
    setReviewsList(prev => prev.map(r => {
      if (r.reviewId === reviewId) {
        return { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 };
      }
      return r;
    }));
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 border-4 border-[#007185] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Loading reviews...</p>
      </div>
    );
  }

  if (!reviewsData) {
    return (
      <div className="py-6 text-center text-xs text-gray-500">
        Could not load customer reviews.
      </div>
    );
  }

  const { overallRating, totalCount, starBreakdown, customersSay, media } = reviewsData;

  // Star rendering utility
  const renderStars = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-[#f1a02f] font-bold" style={{ fontSize: `${size}px`, fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-[#f1a02f] font-bold" style={{ fontSize: `${size}px` }}>
            star_half
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="material-symbols-outlined text-gray-300 font-bold" style={{ fontSize: `${size}px` }}>
            star
          </span>
        );
      }
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="w-full text-left font-sans text-[#0f1111] max-w-6xl mx-auto pt-6 border-t border-gray-200">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Ratings breakdown & breakdown details */}
        <div className="lg:col-span-3 flex flex-col gap-4 max-w-[280px]">
          <div>
            <h2 className="text-xl font-bold font-sans text-gray-900 leading-tight">Customer reviews</h2>
            <div className="flex items-center gap-2 mt-2">
              {renderStars(overallRating, 18)}
              <span className="text-sm font-bold text-gray-900">{overallRating} out of 5</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 select-none font-medium">
              {totalCount.toLocaleString()} global ratings
            </p>
          </div>

          {/* Star breakdowns progress bars */}
          <div className="flex flex-col gap-2 mt-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const pct = starBreakdown[stars] || 0;
              return (
                <div key={stars} className="flex items-center gap-2.5 text-xs text-[#007185]">
                  <span className="hover:underline cursor-pointer select-none whitespace-nowrap min-w-[34px] text-right font-medium">
                    {stars} star
                  </span>
                  
                  {/* Outlined / Bordered Progress Bar Container */}
                  <div className="flex-grow h-5 border border-gray-300 rounded bg-[#f0f2f2] overflow-hidden relative shadow-inner">
                    <div 
                      className="h-full bg-[#f1a02f] border-r border-[#c45500]/50 rounded-l-sm" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  
                  <span className="hover:underline cursor-pointer select-none min-w-[28px] text-left font-medium">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* How ratings calculated Collapsible */}
          <div className="text-xs">
            <button 
              onClick={() => setIsHowCalculatedOpen(!isHowCalculatedOpen)}
              className="flex items-center gap-1 text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer font-bold focus:outline-none"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isHowCalculatedOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
              How are ratings calculated?
            </button>
            {isHowCalculatedOpen && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600 leading-normal animate-fade-in">
                To calculate the overall star rating and percentage breakdown by star, we don’t use a simple average. Instead, our system considers things like how recent a review is and if the reviewer bought the item on Amazon. It also analyses reviews to verify trustworthiness.
              </div>
            )}
          </div>

          <hr className="border-gray-200 my-1" />

          {/* Review this product call to action */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900 leading-tight">Review this product</h3>
            <p className="text-xs text-gray-500 leading-tight">Share your thoughts with other customers</p>
            <button 
              onClick={() => alert('Review portal is read-only for prototype verification purposes.')}
              className="w-full bg-white hover:bg-gray-50 border border-gray-300 rounded-full py-1.5 px-4 font-medium text-xs shadow-sm hover:shadow text-gray-800 transition-all focus:outline-none cursor-pointer mt-1"
            >
              Write a product review
            </button>
          </div>
        </div>

        {/* Right Content Area: AI Summary, Photos, and Individual Reviews */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* Customers say summary */}
          {customersSay && (
            <div className="bg-[#fafafa] border border-gray-200 rounded-lg p-5 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">Customers say</h3>
              <p className="text-xs text-gray-700 leading-relaxed font-sans font-medium">
                {customersSay.summary}
              </p>
              
              {/* AI generated disclaimer badge */}
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500 font-bold select-none border-b border-gray-200/60 pb-3 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>Generated from the text of customer reviews.</span>
              </div>

              {/* Topic links row */}
              <div className="mt-4 space-y-2">
                <p className="font-bold text-xs text-gray-800">Select to learn more</p>
                <div className="flex flex-wrap gap-2">
                  {customersSay.topics.map(t => (
                    <button 
                      key={t.name}
                      onClick={() => alert(`Showing reviews matching "${t.name}"`)}
                      className="border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full text-xs text-[#007185] hover:text-[#c45500] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <span className="text-[10px]">↗</span>
                      <span>{t.name}</span>
                      <span className="text-gray-400 font-normal">({t.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customer Photos carousel */}
          {media && media.length > 0 && (
            <div className="text-left space-y-3 relative group">
              <div className="flex justify-between items-center pr-2">
                <h3 className="font-bold text-sm text-gray-900">Customer photos and videos</h3>
                <span className="text-xs text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer font-bold select-none">
                  See all ›
                </span>
              </div>

              {/* Horizontal scrollable box */}
              <div className="relative flex items-center">
                {/* Left chevron button */}
                <button 
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-1 bg-white/95 border border-gray-300 w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-gray-50 cursor-pointer focus:outline-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-gray-700 text-[18px]">chevron_left</span>
                </button>

                <div 
                  ref={carouselRef}
                  className="flex gap-2 overflow-x-auto scrollbar-none w-full py-1.5 px-1 relative select-none"
                >
                  {media.map((m, idx) => {
                    const isVideo = !!m.videoUrl;
                    return (
                      <div 
                        key={idx}
                        className="w-24 h-28 flex-shrink-0 bg-gray-100 rounded border border-gray-300 overflow-hidden relative cursor-pointer group/item hover:border-gray-500 shadow-sm"
                      >
                        {isVideo ? (
                          // Video thumbnail mock
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                            <span className="material-symbols-outlined text-white text-[32px] drop-shadow-md">
                              play_circle
                            </span>
                            <span className="absolute bottom-1 right-1 bg-black/75 text-white font-bold text-[9px] px-1 rounded">
                              {m.videoDuration}
                            </span>
                          </div>
                        ) : (
                          // Image thumbnail
                          <img className="w-full h-full object-cover" alt="Review media" src={m.photoUrl} />
                        )}

                        {/* Orange star rating overlay bottom-left */}
                        <div className="absolute bottom-1 left-1 bg-black/60 px-1 rounded flex items-center gap-0.5 text-[#febd69]">
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-[9px] font-bold text-white">{m.rating}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right chevron button */}
                <button 
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-1 bg-white/95 border border-gray-300 w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-gray-50 cursor-pointer focus:outline-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-gray-700 text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}

          <hr className="border-gray-200 my-1" />

          {/* Top Reviews from India */}
          <div className="text-left space-y-4">
            <h3 className="font-bold text-sm text-gray-900">Top reviews from India</h3>
            
            <div className="flex flex-col gap-4">
              {reviewsList.map(r => {
                const isHelpful = helpfulClicked[r.reviewId];
                return (
                  <div key={r.reviewId} className="border-b border-gray-150 pb-4 flex flex-col gap-2">
                    
                    {/* User profile avatar & name */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-gray-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          person
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{r.reviewerName}</span>
                    </div>

                    {/* Star rating + title */}
                    <div className="flex items-center gap-2">
                      {renderStars(r.rating, 14)}
                      <span className="text-xs font-bold text-gray-950">{r.title}</span>
                    </div>

                    {/* Metadata line */}
                    <p className="text-[11px] text-gray-500 font-medium">
                      Reviewed in India on {new Date(r.reviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {/* Variant details (if exists) + Verified Purchase */}
                    <div className="text-[11px] flex flex-wrap items-center gap-1.5 text-gray-500 font-medium select-none">
                      {r.size && (
                        <>
                          <span>Size: {r.size}</span>
                          <span>|</span>
                        </>
                      )}
                      {productId === 'apparel-prod-1' && (
                        <>
                          <span>Colour: Charcoal</span>
                          <span>|</span>
                        </>
                      )}
                      <span className="text-[#c45500] font-bold">Verified Purchase</span>
                    </div>

                    {/* Review body paragraph split */}
                    <div className="text-xs text-gray-800 space-y-1.5 leading-relaxed pr-2 font-medium font-sans whitespace-pre-line">
                      {r.reviewText}
                    </div>

                    {/* Helpful count */}
                    {r.helpfulVotes > 0 && (
                      <p className="text-[11px] text-gray-500 font-medium select-none">
                        {r.helpfulVotes === 1 ? 'One person found this helpful' : `${r.helpfulVotes} people found this helpful`}
                      </p>
                    )}

                    {/* Helpful button + Report */}
                    <div className="flex items-center gap-3.5 mt-1 select-none">
                      <button 
                        onClick={() => handleHelpfulClick(r.reviewId)}
                        disabled={isHelpful}
                        className={`bg-white border rounded-full py-1 px-5 text-[10px] text-gray-800 shadow-sm transition-all focus:outline-none font-semibold ${
                          isHelpful 
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-default' 
                            : 'border-gray-300 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        {isHelpful ? 'Helpful ✓' : 'Helpful'}
                      </button>
                      <span className="text-gray-300 text-xs">|</span>
                      <button 
                        onClick={() => alert('Report submitted. Thank you for your feedback.')}
                        className="text-xs text-gray-400 hover:text-[#c45500] hover:underline bg-transparent border-none cursor-pointer p-0 font-medium focus:outline-none"
                      >
                        Report
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination Load More button */}
            {reviewsData.hasMore && (
              <div className="pt-2 text-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-[#0f1111] font-bold text-xs py-2 px-6 rounded-lg shadow-sm focus:outline-none cursor-pointer transition-all hover:shadow min-w-[140px]"
                >
                  {loadingMore ? 'Loading...' : 'See more reviews'}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
