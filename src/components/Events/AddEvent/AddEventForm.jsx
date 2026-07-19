import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getTimezoneAbbreviation,
  getUserTimezone,
} from "../../../utils/TimeZoneUtils";
import eventService from "../../Services/EventService";
import "./AddEventForm.css";

function AddEventForm() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const location = useLocation();
  const [userTimezone, setUserTimezone] = useState(getUserTimezone());
  const [timezoneAbbr, setTimezoneAbbr] = useState("");
  const loggedInEmail = localStorage.getItem("email");
  const isEditMode = Boolean(eventId) || location.state?.event;
  const eventToEdit = location.state?.event;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm({
    mode: "onChange", // Instant validation
    defaultValues: {
      title: "",
      short_description: "",
      long_description: "",
      organizer_email: "",
      event_datetime: "",
      timezone: "",
      event_type: "online",
      event_link: "",
      event_host_name: "",
      event_host_email: "",
      event_location: "",
      tags: "",
      duration: "",
    },
  });

  // Watch event_type to show/hide fields
  const eventType = watch("event_type");

  const [isLoading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Set user's timezone on component mount
  useEffect(() => {
    const tz = getUserTimezone();
    const abbr = getTimezoneAbbreviation(tz);
    setUserTimezone(tz);
    setTimezoneAbbr(abbr);
    setValue("timezone", tz);
  }, [setValue]);

  // Load event data if editing
  useEffect(() => {
    const loadEventData = async () => {
      if (isEditMode) {
        try {
          let eventData = eventToEdit;

          if (!eventData && eventId) {
            setLoading(true);
            const response = await eventService.getEventById(eventId);
            if (response.success) {
              eventData = response.dto;
            } else {
              setMessage({ text: "Failed to load event data", type: "error" });
              return;
            }
          }

          if (eventData) {
            const eventDate = new Date(eventData.eventDateTime);
            const localDateTime = new Date(
              eventDate.getTime() - eventDate.getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 16);

            reset({
              title: eventData.title || "",
              short_description: eventData.shortDescription || "",
              long_description: eventData.longDescription || "",
              organizer_email: loggedInEmail || "",
              event_datetime: localDateTime,
              timezone: eventData.timezone || userTimezone,
              event_type: eventData.eventType || "online",
              event_link: eventData.eventLink || "",
              event_location: eventData.eventLocation || "",
              event_host_name: eventData.eventHostName || "",
              event_host_email: eventData.eventHostEmail || "",
              tags: eventData.tags || "",
              duration: eventData.duration || "",
            });
          }
        } catch (error) {
          console.error("Error loading event:", error);
          setMessage({ text: "Failed to load event data", type: "error" });
        } finally {
          setLoading(false);
        }
      }
    };

    loadEventData();
  }, [isEditMode, eventId, eventToEdit, userTimezone, reset, loggedInEmail]);

  const convertToISO8601 = (datetimeLocal) => {
    if (!datetimeLocal) return "";
    const date = new Date(datetimeLocal);
    return date.toISOString();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessage({
        text: `You must be logged in to ${
          isEditMode ? "edit" : "create"
        } an event. Redirecting to login...`,
        type: "error",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      setLoading(false);
      return;
    }

    try {
      const formattedData = {
        ...data,
        event_datetime: convertToISO8601(data.event_datetime),
        timezone: userTimezone,
      };

      if (formattedData.event_type === "online") {
        formattedData.event_location = null;
      } else if (formattedData.event_type === "in-person") {
        formattedData.event_link = null;
      }

      let response;
      if (isEditMode) {
        response = await eventService.updateEvent(
          eventId || eventToEdit.eventId,
          formattedData
        );
      } else {
        response = await eventService.createEvent(formattedData);
      }

      if (response.success) {
        setMessage({
          text: isEditMode
            ? "Event updated successfully! 🎉"
            : "Event created successfully! 🎉",
          type: "success",
        });

        setTimeout(() => {
          if (isEditMode) {
            navigate(`/events/${eventId || eventToEdit.eventId}`);
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } else {
        setMessage({
          text:
            response.message ||
            (isEditMode ? "Failed to update event" : "Failed to create event"),
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setMessage({ text: "Error: " + error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const response = await eventService.deleteEvent(eventId);

      if (response.success) {
        setMessage({ text: "Event deleted successfully 🗑️", type: "success" });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        setMessage({
          text: response.message || "Failed to delete event",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Error: " + error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-container">
      <h2>{isEditMode ? "Edit Event ✏️" : "Create New Event 🌸"}</h2>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`event-form ${!isEditMode ? "event-form--create" : ""}`}
      >
        {/* Event Title */}
        <div className="form-group form-group--full form-group--title">
          <label htmlFor="title">Event Title</label>
          <input
            type="text"
            id="title"
            placeholder="e.g., Tech Sisters Meetup"
            className={errors.title ? "error" : ""}
            {...register("title", {
              required: "Event title is required",
              minLength: {
                value: 3,
                message: "Title must be at least 3 characters",
              },
              maxLength: {
                value: 120,
                message: "Title must not exceed 120 characters",
              },
            })}
          />
          {errors.title && (
            <span className="error-message">{errors.title.message}</span>
          )}
        </div>

       

        {isEditMode && (
          <div className="form-group form-group--full">
            <label htmlFor="long_description">Additional Event Details</label>
            <textarea
              id="long_description"
              rows="5"
              placeholder="Add more details about your event..."
              {...register("long_description")}
            />
          </div>
        )}

        {/* Event Date & Time */}
        <div className="form-group">
          <label htmlFor="event_datetime">Event Date & Time</label>
          <input
            type="datetime-local"
            id="event_datetime"
            {...register("event_datetime", {
              required: "Event date and time is required",
            })}
          />
          <small className="helper-text">
            <strong>{timezoneAbbr}</strong> ({userTimezone})
          </small>
          {errors.event_datetime && (
            <span className="error-message">
              {errors.event_datetime.message}
            </span>
          )}
        </div>

        {/* Timezone - Hidden */}
        <input type="hidden" {...register("timezone")} />

        {/* Event Type */}
        <div className="form-group">
          <label htmlFor="event_type">Event Type</label>
          <select
            id="event_type"
            {...register("event_type", { required: true })}
          >
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
          </select>
        </div>

        {/* Event Link / Location */}
        {eventType === "online" ? (
          <div className="form-group">
            <label htmlFor="event_link">Event Link (Online)</label>
            <input
              type="url"
              id="event_link"
              placeholder="https://zoom.com/meeting (you can add this later)"
              {...register("event_link", {
                validate: {
                  startsWithHttp: (value) => {
                    if (!value) return true;
                    return (
                      value.startsWith("http://") ||
                      value.startsWith("https://") ||
                      "URL must start with http:// or https://"
                    );
                  },
                },
              })}
            />
            {errors.event_link && (
              <span className="error-message">{errors.event_link.message}</span>
            )}
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="event_location">Event Location (In-Person)</label>
            <input
              type="text"
              id="event_location"
              placeholder="123 Street, City, Country"
              {...register("event_location", {
                required:
                  eventType === "in-person"
                    ? "Location is required for in-person events"
                    : false,
              })}
            />
            {errors.event_location && (
              <span className="error-message">
                {errors.event_location.message}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <div className="form-group form-group--full form-group--description">
          <label htmlFor="short_description">Description</label>
          <textarea
            id="short_description"
            rows={isEditMode ? 4 : 3}
            placeholder="Share a short intro about your event (you can add more details after creating it)."
            className={errors.short_description ? "error" : ""}
            {...register("short_description", {
              required: "Short description is required",
              maxLength: {
                value: 200,
                message: "Short description must not exceed 200 characters",
              },
            })}
          />
          {errors.short_description && (
            <span className="error-message">
              {errors.short_description.message}
            </span>
          )}
        </div>

        {/* Host Email */}
        <div className="form-group">
          <label htmlFor="event_host_email">Host Email</label>
          <input
            type="email"
            id="event_host_email"
            placeholder="host@example.com"
            {...register("event_host_email", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.event_host_email && (
            <span className="error-message">
              {errors.event_host_email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="event_host_name">Event Host Name</label>
          <input
            type="text"
            id="event_host_name"
            placeholder="Grace W"
            {...register("event_host_name", {
              required: "Host name is required",
            })}
          />
          {errors.event_host_name && (
            <span className="error-message">
              {errors.event_host_name.message}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="form-group">
          <label htmlFor="duration">Duration (minutes)</label>
          <input
            type="number"
            id="duration"
            placeholder="e.g., 60"
            min="1"
            {...register("duration", {
              min: {
                value: 10,
                message: "Duration must be at least 10 minutes",
              },
            })}
          />
          {errors.duration && (
            <span className="error-message">{errors.duration.message}</span>
          )}
        </div>

        {/* Tags */}
        {/* <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            placeholder="e.g., AI, Tech, Community"
            {...register("tags", {
              validate: (value) => {
                if (!value?.trim()) return true;

                const tags = value.split(",").map((tag) => tag.trim());
                const hasEmptyTag = tags.some((tag) => !tag);

                return !hasEmptyTag || "Enter tags separated by commas without leaving any empty tags";
              },
            })}
          />
          <small className="helper-text">Separate tags with commas</small>
          
          {errors.tags && (
            <span className="error-message">{errors.tags.message}</span>
          )}
        </div> */}
        

        <div className="form-actions form-group--full">
          {isEditMode && (
            <button
              type="button"
              className="delete-button"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete Event
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={() => (isEditMode ? navigate(-1) : navigate("/dashboard"))}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading
              ? isEditMode
                ? "Updating Event..."
                : "Creating Event..."
              : isEditMode
              ? "Update Event"
              : "Create Event 🎉"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddEventForm;
