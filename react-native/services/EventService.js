import api from "./api";

const eventService = {
  createEvent: async (eventData) => {
    try {
      const response = await api.post("/events/create-new", eventData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to create event";
      throw new Error(message);
    }
  },

  getAllEvents: async (page = 0, size = 6, type = "UPCOMING", query) => {
    try {
      const response = await api.get(
        `/public/events/all?page=${page}&size=${size}&listType=${type}&searchQuery=${query || ""}`,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to fetch events";
      throw new Error(message);
    }
  },

  getEventById: async (eventId) => {
    try {
      const response = await api.get(`/public/events/id?eventId=${eventId}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to fetch event";
      throw new Error(message);
    }
  },

  rsvpToEvent: async (eventId, rsvp = true) => {
    try {
      const response = await api.post("/events/rsvp", {
        event_id: eventId,
        rsvp,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to RSVP";
      throw new Error(message);
    }
  },

  getMyRSVPs: async (page = 0, size = 6) => {
    try {
      const response = await api.get(`/events/my-rsvps?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to fetch RSVPs";
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
      throw new Error(message);
    }
  },

  updateEvent: async (eventId, eventData) => {
    try {
      const response = await api.put(`/events/update?eventId=${eventId}`, eventData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to update event";
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
