import { useEffect, useRef, useState } from "react";
import eventService from "../../components/Services/EventService";
import LoadingComponent from "../Loading/LoadingComponent";
import EventCard from "./EventCard/EventCard";
import "./MyEventsPage.css";

// Swiper imports
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { A11y, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState("created"); // "rsvps" | "created"
  const [loading, setLoading] = useState(true);
  const [myCreatedEvents, setMyCreatedEvents] = useState([]);
  const [myRsvps, setMyRsvps] = useState([]);

  // Pagination state — separate tracking per tab
  const [pageSize] = useState(3);
  const [createdTotalPages, setCreatedTotalPages] = useState(0);
  const [createdTotalElements, setCreatedTotalElements] = useState(0);

  const createdPageRef = useRef(0);
  const [rsvpsTotalPages, setRsvpsTotalPages] = useState(0);
  const [rsvpTotalElements, setRsvpTotalElements] = useState(0);
  const rsvpsPageRef = useRef(0);

  // Track which tabs have already been fetched to avoid redundant calls
  const hasFetchedCreated = useRef(false);
  const hasFetchedRsvps = useRef(false);

  // Lazy fetch: only load data for the active tab (and only once per tab)
  useEffect(() => {
    if (activeTab === "created" && !hasFetchedCreated.current) {
      fetchCreatedEvents(0);
    } else if (activeTab === "rsvps" && !hasFetchedRsvps.current) {
      fetchRsvps(0);
    }
  }, [activeTab]);

  const fetchCreatedEvents = async (page) => {
    try {
      if (page === 0) setLoading(true);
      const created = await eventService.getMyCreatedEvents(page, pageSize);
      console.log("Created events:", created);

      if (created?.events) {
        setMyCreatedEvents((prev) => {
          if (page === 0) return created.events;
          // Append & deduplicate
          const combined = [...prev, ...created.events];
          return Array.from(
            new Map(combined.map((e) => [e.eventId, e])).values(),
          );
        });
        setCreatedTotalPages(created.totalPages || 0);
        setCreatedTotalElements(created.totalElements || 0);
        createdPageRef.current = page;
      }
      hasFetchedCreated.current = true;
    } catch (err) {
      console.error("Error loading created events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRsvps = async (page) => {
    try {
      if (page === 0) setLoading(true);
      const rsvps = await eventService.getMyRSVPs(page, pageSize);
      console.log("My RSVPs:", rsvps);

      if (rsvps?.events) {
        setMyRsvps((prev) => {
          if (page === 0) return rsvps.events;
          // Append & deduplicate
          const combined = [...prev, ...rsvps.events];
          return Array.from(
            new Map(combined.map((e) => [e.eventId, e])).values(),
          );
        });
        setRsvpsTotalPages(rsvps.totalPages || 0);
        setRsvpTotalElements(rsvps.totalElements || 0);
        rsvpsPageRef.current = page;
      }
      hasFetchedRsvps.current = true;
    } catch (err) {
      console.error("Error loading RSVPs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Called by Swiper when user reaches the last slide
  const handleReachEnd = () => {
    console.log("created Total pg: "+createdTotalPages);
    console.log("RSVPS Total pg: "+rsvpsTotalPages);

    if (activeTab === "created" && createdPageRef.current + 1 < createdTotalPages) {
      fetchCreatedEvents(createdPageRef.current + 1);
    } else if (activeTab === "rsvps" && rsvpsPageRef.current + 1 < rsvpsTotalPages) {
      fetchRsvps(rsvpsPageRef.current + 1);
    }
  };



  // LOADING UI
  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingComponent />
      </div>
    );
  }

  const activeList = activeTab === "created" ? myCreatedEvents : myRsvps;

  return (
    <div className="my-events-page">
      <h2 className="section-title">
        {activeTab === "created" ? "My Created Events" : "My RSVPs"}
      </h2>

      {/* --- Toggle Buttons (same style as Dashboard) --- */}
      <div className="filter-controls">
        <button
          className={`filter-button ${activeTab === "created" ? "active" : ""}`}
          onClick={() => setActiveTab("created")}
        >
          🎨 Created Events ({createdTotalElements})
        </button>

        <button
          className={`filter-button ${activeTab === "rsvps" ? "active" : ""}`}
          onClick={() => setActiveTab("rsvps")}
        >
          📨 My RSVPs ({rsvpTotalElements})
        </button>
      </div>

      {/* EVENTS SWIPER (matches Dashboard layout) */}
      {activeList.length > 0 ? (
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
          onReachEnd={handleReachEnd}
          className="events-swiper"
        >
          {activeList.map((event) => (
            <SwiperSlide key={event.eventId}>
              <EventCard event={event} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="empty-filtered-state">
          <p className="empty-text">
            {activeTab === "created"
              ? "You haven't created any events yet."
              : "You haven't RSVP'd to any events yet."}
          </p>
        </div>
      )}
    </div>
  );
}
