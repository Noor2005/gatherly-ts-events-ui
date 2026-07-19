import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authService from "../../components/Services/AuthService";
import eventService from "../../components/Services/EventService";
import {
  formatEventDateTime,
  getRelativeDate,
  getTimeUntilEvent,
  getTimezoneAbbreviation,
} from "../../utils/TimeZoneUtils";
import GoogleCalendarEventButton from "../Account/GoogleAuth/GoogleCalendarEventButton";
import DownloadEvent from "../Events/DownloadEvent/DownloadEvent";
import LoadingComponent from "../Loading/LoadingComponent";
import "./EventDetailsPage.css";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [hasRSVPed, setHasRSVPed] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await eventService.getEventById(eventId);
        const dto = res.dto || res.data || res; // defensive
        setEvent(dto);
        

        const loggedInUser = authService.getUserEmail();
        if (loggedInUser && dto.createdBy === loggedInUser) {
          setIsCreator(true);
        }

        setHasRSVPed(!!dto.currentUserRSVP);
      } catch (err) {
        console.error("Failed to load event", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  const handleRSVP = async () => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    try {
      setRsvpLoading(true);
      const res = await eventService.rsvpToEvent(event.eventId, true);
      if (res.success) {
        setHasRSVPed(true);
        setMessage("RSVP successful!");
      } else {
        setMessage(res.message || "Failed to RSVP");
      }
    } catch (err) {
      setMessage(err.message || "Failed to RSVP");
    } finally {
      setRsvpLoading(false);
      setTimeout(() => setMessage(""), 2500);
    }
  };

  console.log("Loaded event: ",event);

  if (loading)
    return (
      <div className="dashboard-container">
        <LoadingComponent />
      </div>
    );
  if (!event)
    return <div className="event-details-loading">Event not found</div>;

  // use your timezone helpers
  const { date, time } = formatEventDateTime(event.eventDateTime);
  const relativeDate = getRelativeDate(event.eventDateTime);
  const timeUntil = getTimeUntilEvent(event.eventDateTime);
  const userTimeZone = getTimezoneAbbreviation();
  const isPastEvent = new Date(event.eventDateTime) < new Date();

  const tags = (event.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // build share URL (optional)
  const eventUrl = `${window.location.origin}/events/${event.eventId}`;

  const handleEdit = () => {
    navigate(`/edit-event/${eventId}`, { state: { event } });
  };

  return (
    <div className="event-details-page-root">
      <div className="event-details-inner">
        {/* LEFT COLUMN */}
        <main className="event-left">
          <h1 className="event-hero-title">{event.title}</h1>

          <div className="event-meta-row">
            <div className="meta-item">
              <span className="meta-icon">👤</span>
              <span className="meta-text">
                By <strong>{event.eventHostName}</strong>
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">📍</span>
              <span className="meta-text">
                {event.eventLocation || "Online"}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <span className="meta-text">
                {relativeDate} · {time} ({userTimeZone})
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🕛</span>
              <span className="meta-text">
                {event.duration ? `${event.duration} mins` : "-"}
              </span>
            </div>
          </div>

          <hr className="separator" />

          <section className="overview">
            <h2 className="section-heading">Overview</h2>
            <p className="overview-text">
              {event.shortDescription || event.short_description || ""}
            </p>

            {/* long description if present */}
            {event.long_description || event.longDescription ? (
              <div className="long-description">
                {event.long_description || event.longDescription}
              </div>
            ) : null}

            

            {/* <div className="event-categories">
              <span className="cat-label">Category:</span>
              {tags.map((t, i) => (
                <span
                  key={i}
                  className={`cat-pill ${
                    i === tags.length - 1 ? "active" : ""
                  }`}
                >
                  {t}
                </span>
              ))}
            </div> */}
          </section>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="event-right">
          <div className="right-card simple-actions">
            {isCreator && (
              <button className="action-btn edit-btn" onClick={handleEdit}>
                Edit Event
              </button>
            )}

            <button
              className="action-btn reserve-btn"
              onClick={handleRSVP}
              disabled={rsvpLoading || isPastEvent || hasRSVPed}
            >
              {rsvpLoading
                ? "Processing..."
                : hasRSVPed
                ? "Reserved"
                : "Reserve a spot"}
            </button>

            <button
              className="action-btn share-btn"
              onClick={async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: event.title,
                      text: event.short_description || "",
                      url: eventUrl,
                    });
                  } else {
                    await navigator.clipboard.writeText(eventUrl);
                    alert("Link copied to clipboard");
                  }
                } catch (err) {
                  console.error("Share failed", err);
                }
              }}
            >
              Share Event
            </button>

            <GoogleCalendarEventButton eventLink={event.googleCalendarLink} />
            <DownloadEvent eventData={event} />
          </div>
        </aside>
      </div>

      {/* optional small message */}
      {message && <div className="rsvp-message-global">{message}</div>}
    </div>
  );
}
