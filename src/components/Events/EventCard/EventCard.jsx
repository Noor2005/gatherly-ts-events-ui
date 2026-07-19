import { useNavigate } from "react-router-dom";
import {
  formatEventDateTime,
  getRelativeDate,
  getTimeUntilEvent,
  getTimezoneAbbreviation,
  getUserTimezone,
} from "../../../utils/TimeZoneUtils";
import "./EventCard.css";

function EventCard({ event }) {
  // Format the date and time in user's timezone
  const { date, time, dateObject } = formatEventDateTime(event.eventDateTime);
  const relativeDate = getRelativeDate(event.eventDateTime);
  const timeUntil = getTimeUntilEvent(event.eventDateTime);
  const userTimezone = getTimezoneAbbreviation(getUserTimezone());
  const tags = event.tags ? event.tags.split(",").map((tag) => tag.trim()) : [];

  const defaultEventImage = "/eventcard.jpg";
  const eventImageSrc = event.imageUrl || event.image || event.coverImage || defaultEventImage;

  const CHARACTER_LIMIT = 100; // Adjust based on your design

  // Event is past only if NOW is after (start + duration)
  const checkPastEvent = () => {
    if (!dateObject || !event.duration) return false;

    const eventEnd = new Date(dateObject.getTime() + event.duration * 60000);
    return new Date() > eventEnd;
  };
  const navigate = useNavigate();

  const handleViewDetails = (e) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/events/${event.eventId}`);
  };

  const handleShare = async (e) => {
    e.stopPropagation(); // prevents card click

    const shareUrl = `${window.location.origin}/events/${event.eventId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: "Join this event!",
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share canceled or failed:", error);
      }
    } else {
      // Fallback for desktop
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  // Check if event is currently live
  const isLiveEvent = () => {
    if (!event.eventDateTime || !event.duration) return false;

    const start = new Date(event.eventDateTime);
    const end = new Date(start.getTime() + event.duration * 60000);
    const now = new Date();

    return now >= start && now <= end;
  };

  return (
    <div className={`event-card ${checkPastEvent() ? "past-event" : ""}`}>
      <div className="event-image-wrapper">
        <img
          className="event-image"
          src={eventImageSrc}
          alt={event.title || "Event image"}
        />
      </div>
      {/* Event Title & Event link*/}
      <div className="event-header">

        <h3
          className="event-title"
          onClick={handleViewDetails}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleViewDetails(e);
            }
          }}
          tabIndex={0}
        >
          {event.title}
        </h3>

        <button className="share-button header-share-button" onClick={handleShare} aria-label="Share">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.12-4.11C16.56 7.62 17.24 7.92 18 7.92c1.66 0 3-1.34 3-3S19.66 1.92 18 1.92 15 3.26 15 4.92c0 .24.04.47.09.7L8 9.73C7.44 9.36 6.74 9.08 6 9.08 4.34 9.08 3 10.42 3 12s1.34 2.92 3 2.92c.74 0 1.44-.28 1.99-.65l7.12 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        </button>
        {/* header action (join/countdown) shown on hover */}
        <div className="header-action">
          {event.eventType === "online" && isLiveEvent() ? (
            <a
              href={event.eventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="join-now header-join-now"
              onClick={(e) => e.stopPropagation()}
            >
              Join Now
            </a>
          ) : (
            !checkPastEvent() && (
              <div className="header-time-until">
                {/* <span className="time-until-icon">⏳</span> */}
                <span className="time-until-text">{timeUntil}</span>
              </div>
            )
          )}
        </div>
        
      </div>
      {/* Event Description */}
      <p className="event-description">
        {event.shortDescription.length > 40 ? (
          <>
            {event.shortDescription.slice(0, 40)}...{" "}
            <span
              className="see-more-link"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(e);
              }}
            >
              See more
            </span>
          </>
        ) : (
          event.shortDescription
        )}
      </p>
      <div className="event-divider" />

      {/* Event Details */}
      <div className="event-details">
        <div className="detail-item">
          <span className="detail-text">{relativeDate}</span>
        </div>
        <span className="detail-separator" aria-hidden="true">•</span>
        <div className="detail-item">         
          <span className="detail-text">{time}</span>
        </div>
        <span className="detail-separator" aria-hidden="true">•</span>
        <div className="detail-item">
          <span className="detail-text">Free</span>
        </div>
        

        {/* <div className="detail-item">
           <span className="detail-icon">👥</span> 
          <span className="detail-text">{event.allRSVPs || 0}</span>
        </div> */}
      </div>

      {/* Timezone Info 
      <div className="timezone-info">
        <span className="timezone-icon">🌍</span>
        <span className="timezone-text">
          {userTimezone} (Your timezone)
        </span>
      </div> */}

      {/* Organizer Info */}
      {/* <div className="organizer-info">
        <span className="organizer-label">Host: </span>
        <span className="organizer-email">{event.eventHostName}</span>
      </div> */}

      {/* Tags */}
      {/* {tags.length > 0 && (
        <div className="event-tags">
          {tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )} */}

    </div>
  );
}

export default EventCard;
