import api from "../Services/ApiRequestInterceptor";

const eventService = {
  /**
   * Creates a new event.
   * @param {object} eventData - The event data to send.
   * @returns {Promise<object>} The data from the API response.
   */
  createEvent: async (eventData) => {
    try {
      // Use 'api.post'
      // - 1st arg: The relative path (assuming 'api' is configured to '.../api')
      // - 2nd arg: The data object (axios handles stringify)
      const response = await api.post("/events/create-new", eventData);

      // axios puts the response data in the 'data' property
      return response.data;
    } catch (error) {
      // This catch block will now handle non-auth errors (like 400, 500)
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create event";
      console.error("Error creating new event: ", message);
      throw new Error(message);
    }
  },

  /**
   * Fetches all events(PUBLIC - but sends auth token if available).
   * @returns {Promise<object>} The data from the API response.
   */
  getAllEvents: async (page = 0, size = 6, type = "UPCOMING", query) => {
    try {
      console.log(type, page, size);
      const response = await api.get(`/public/events/all?page=${page}&size=${size}&listType=${type}&searchQuery=${query}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch events";
      console.error("Error fetching events:", message);
      throw new Error(message);
    }
  },

  /**
   * Fetches a single event by ID.
   * @param {number} eventId - The event ID
   * @returns {Promise<object>} The event data
   */
  getEventById: async (eventId) => {
    try {
      const response = await api.get(`/public/events/id?eventId=${eventId}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch event";
      console.error("Error fetching event:", message);
      throw new Error(message);
    }
  },
  /**
   * Submit RSVP for an event.
   * @param {number} eventId - The event ID
   * @param {boolean} rsvp - RSVP status (true = attending)
   * @returns {Promise<object>} The response data
   */
  rsvpToEvent: async (eventId, rsvp = true) => {
    try {
      const response = await api.post("/events/rsvp", {
        event_id: eventId,
        rsvp: rsvp,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to RSVP";
      console.error("Error submitting RSVP:", message);
      throw new Error(message);
    }
  },

  /**
   * Get user's RSVPs.
   * @returns {Promise<object>} List of events the user has RSVP'd to
   */
  getMyRSVPs: async (page = 0, size = 6) => {
    try {
      const response = await api.get(`/events/my-rsvps?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch RSVPs";
      console.error("Error fetching RSVPs:", message);
      throw new Error(message);
    }
  },

  getMyCreatedEvents: async (page = 0, size = 6) => {
    try {
      const response = await api.get(`/events/my-created?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch created-events";
      console.error("Error fetching created-events:", message);
      throw new Error(message);
    }
  },

  /**
   * Updates an existing event (PROTECTED - requires authentication).
   * @param {number} eventId - The event ID
   * @param {object} eventData - The updated event data
   * @returns {Promise<object>} The data from the API response.
   */
  updateEvent: async (eventId, eventData) => {
    try {
      console.log("Updating event:", eventId, eventData);
      const response = await api.put(
        `/events/update?eventId=${eventId}`,
        eventData
      );
      console.log("Event updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating event:", error);
      const message =
        error.response?.data?.message ||-
        error.message ||
        "Failed to update event";
      throw new Error(message);
    }
  },


  deleteEvent: async (eventId) => {
    try {
      const res = await api.delete(`/events/delete?eventId=${eventId}`);
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data || err.message };
    }
  },
};

export default eventService;
