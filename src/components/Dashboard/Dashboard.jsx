import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EventCard from "../Events/EventCard/EventCard";
import LoadingComponent from "../Loading/LoadingComponent";
import eventService from "../Services/EventService";

// Swiper imports
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { A11y, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "./Dashboard.css";

function Dashboard() {
  const [allEvents, setAllEvents] = useState([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("UPCOMING"); // "upcoming" | "past"

  // Pagination state
  const [pageSize] = useState(3);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchInput, setSearchInput] = useState(""); // raw input (instant)
  const [searchQuery, setSearchQuery] = useState(""); // debounced (triggers fetch)

  const isFetchingRef = useRef(false);
  const currentPageRef = useRef(0);
  const debounceTimer = useRef(null);

  const isInitialMount = useRef(true);

  // Initial load
  useEffect(() => {
    fetchEvents(0, activeTab, searchQuery);
  }, []);

  // Tab / search reset
  useEffect(() => {
    currentPageRef.current = 0;
    setAllEvents([]);
    fetchEvents(0, activeTab, searchQuery);
  }, [activeTab, searchQuery]);

  // ── Debounce: commit searchQuery 500ms after user stops typing ──
  useEffect(() => {
    setIsSearching(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 800);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  const fetchEvents = async (page, type = "UPCOMING", query = "") => {
    try {
      // Only set global loading for the first page
      if (page === 0) setIsLoading(true);
      setError(null);

      const response = await eventService.getAllEvents(
        page,
        pageSize,
        type,
        query,
      );

      if (response.success && response.events) {
        setAllEvents((prevEvents) => {
          // If it's page 0 (initial load/tab switch), replace the list
          if (page === 0) return response.events;

          // Otherwise, append new events to the old ones
          const combined = [...prevEvents, ...response.events];

          // Optional: Deduplicate by eventId just in case the API sends duplicates
          return Array.from(
            new Map(combined.map((e) => [e.eventId, e])).values(),
          );
        });
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);

        console.log(allEvents);

        currentPageRef.current = page;
      } else if (response.events && response.events.length === 0) {
        // Treat as empty, not an error
        setAllEvents([]);
        setTotalPages(0);
        setTotalElements(0);
      } else {
        setError(response.message || "No events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Called by Swiper when user reaches the last slide
  const handleReachEnd = () => {
    if (currentPageRef.current + 1 < totalPages) {
      fetchEvents(currentPageRef.current + 1, activeTab, searchQuery); // append next page
    }
  };

  // LOADING UI
  if (isLoading) {
    return (
      <div className="dashboard-container">
        <LoadingComponent />
      </div>
    );
  }

  const handleClear = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  // ERROR UI
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <p className="error-message">⚠️ {error}</p>
          <button
            onClick={fetchEvents(currentPageRef.current, activeTab)}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* <div className="dashboard-header">
        <h2>{activeTab === "UPCOMING" ? "Upcoming Events" : "Past Events"}</h2>
        <p className="event-count">{totalElements} event(s)</p>
      </div> */}

      {/* 🔍 Search + Toggle */}
      <div className="dashboard-search-toggle">
        {/* Search Bar */}
        <div className="dashboard-search-wrapper">
          {/* Leading icon: spinner while searching, magnifier otherwise */}
          {isSearching ? (
            <div className="search-spinner" />
          ) : (
            <Search size={20} className="search-icon" />
          )}

          <input
            type="text"
            placeholder="Search events, keywords, topics..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="dashboard-search-input"
          />
          {/* Clear button — only shown when there's text */}
          {searchInput && (
            <button
              onClick={handleClear}
              className="search-clear-btn"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Toggle */}
        <div className="dashboard-toggle-container">
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`dashboard-toggle-btn ${
              activeTab === "UPCOMING" ? "active" : ""
            }`}
          >
            Upcoming
          </button>

          <button
            onClick={() => setActiveTab("PAST")}
            className={`dashboard-toggle-btn ${
              activeTab === "PAST" ? "active" : ""
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {allEvents.length === 0 ? (
        <div className="empty-filtered-state">
          <p className="empty-message">
            {activeTab === "PAST"
              ? "📭 No past events to show"
              : "🎉 No upcoming events at the moment"}
          </p>
        </div>
      ) : (
        <>
          <Swiper
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            observer={true}
            observeParents={true}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            onReachEnd={handleReachEnd} // fetch next page when last slide is reached
            className="events-swiper"
          >
            {allEvents.map((event) => (
              <SwiperSlide key={event.eventId}>
                <EventCard event={event} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Server-side pagination */}
        </>
      )}
    </div>
  );
}

export default Dashboard;
