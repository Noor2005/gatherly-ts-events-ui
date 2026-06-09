import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FormField from "../components/FormField";
import authService from "../services/AuthService";
import eventService from "../services/EventService";
import {
  getTimezoneAbbreviation,
  getUserTimezone,
} from "../../src/utils/TimeZoneUtils";
import { colors } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";

const emptyForm = {
  title: "",
  short_description: "",
  long_description: "",
  event_datetime: "",
  event_type: "online",
  event_link: "",
  event_location: "",
  event_host_name: "",
  event_host_email: "",
  tags: "",
  duration: "",
};

export default function AddEventForm({ navigation, route }) {
  const eventId = route.params?.eventId;
  const eventToEdit = route.params?.event;
  const isEditMode = Boolean(eventId || eventToEdit);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [userTimezone, setUserTimezone] = useState(getUserTimezone());
  const [timezoneAbbr, setTimezoneAbbr] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  useEffect(() => {
    const tz = getUserTimezone();
    setUserTimezone(tz);
    setTimezoneAbbr(getTimezoneAbbreviation(tz));
  }, []);

  useEffect(() => {
    const loadEventData = async () => {
      if (!isEditMode) return;

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
            eventDate.getTime() - eventDate.getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);

          setForm({
            title: eventData.title || "",
            short_description: eventData.shortDescription || "",
            long_description: eventData.longDescription || "",
            event_datetime: localDateTime,
            event_type: eventData.eventType || "online",
            event_link: eventData.eventLink || "",
            event_location: eventData.eventLocation || "",
            event_host_name: eventData.eventHostName || "",
            event_host_email: eventData.eventHostEmail || "",
            tags: eventData.tags || "",
            duration: String(eventData.duration || ""),
          });
        }
      } catch (error) {
        console.error("Error loading event:", error);
        setMessage({ text: "Failed to load event data", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [isEditMode, eventId, eventToEdit]);

  const validate = () => {
    const next = {};
    if (!form.title || form.title.length < 3) {
      next.title = "Title must be at least 3 characters";
    }
    if (!form.short_description) {
      next.short_description = "Short description is required";
    }
    if (!form.event_datetime) {
      next.event_datetime = "Event date and time is required";
    }
    if (!form.event_host_name) {
      next.event_host_name = "Host name is required";
    }
    if (form.event_type === "in-person" && !form.event_location) {
      next.event_location = "Location is required for in-person events";
    }
    if (
      form.event_link &&
      !form.event_link.startsWith("http://") &&
      !form.event_link.startsWith("https://")
    ) {
      next.event_link = "URL must start with http:// or https://";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const convertToISO8601 = (datetimeLocal) => {
    if (!datetimeLocal) return "";
    return new Date(datetimeLocal).toISOString();
  };

  const onSubmit = async () => {
    if (!validate()) return;

    const token = authService.isAuthenticated();
    if (!token) {
      setMessage({
        text: `You must be logged in to ${isEditMode ? "edit" : "create"} an event.`,
        type: "error",
      });
      setTimeout(() => navigation.navigate("Login"), 2000);
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const formattedData = {
        ...form,
        event_datetime: convertToISO8601(form.event_datetime),
        timezone: userTimezone,
        duration: form.duration ? Number(form.duration) : undefined,
      };

      if (formattedData.event_type === "online") {
        formattedData.event_location = null;
      } else {
        formattedData.event_link = null;
      }

      let response;
      if (isEditMode) {
        response = await eventService.updateEvent(
          eventId || eventToEdit.eventId,
          formattedData,
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
            navigation.navigate("EventDetails", {
              eventId: eventId || eventToEdit.eventId,
            });
          } else {
            navigation.navigate("Main", { screen: "Dashboard" });
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
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await eventService.deleteEvent(eventId);
              if (response.success) {
                setMessage({ text: "Event deleted successfully 🗑️", type: "success" });
                setTimeout(() => {
                  navigation.navigate("Main", { screen: "Dashboard" });
                }, 1200);
              } else {
                setMessage({
                  text: response.message || "Failed to delete event",
                  type: "error",
                });
              }
            } catch (error) {
              setMessage({ text: `Error: ${error.message}`, type: "error" });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={commonStyles.screen} keyboardShouldPersistTaps="handled">
      <Text style={commonStyles.sectionTitle}>
        {isEditMode ? "Edit Event ✏️" : "Create New Event 🌸"}
      </Text>

      {message.text ? (
        <View
          style={[
            styles.banner,
            message.type === "error" ? styles.bannerError : styles.bannerSuccess,
          ]}
        >
          <Text style={styles.bannerText}>{message.text}</Text>
        </View>
      ) : null}

      <FormField
        label="Event Title"
        value={form.title}
        onChangeText={(v) => setField("title", v)}
        placeholder="e.g., Tech Sisters Meetup"
        error={errors.title}
      />

      <FormField
        label="Description"
        value={form.short_description}
        onChangeText={(v) => setField("short_description", v)}
        placeholder="Short intro about your event"
        multiline
        error={errors.short_description}
      />

      {isEditMode && (
        <FormField
          label="Additional Event Details"
          value={form.long_description}
          onChangeText={(v) => setField("long_description", v)}
          placeholder="Add more details..."
          multiline
        />
      )}

      <FormField
        label="Event Date & Time"
        value={form.event_datetime}
        onChangeText={(v) => setField("event_datetime", v)}
        placeholder="YYYY-MM-DDTHH:mm"
        error={errors.event_datetime}
        helperText={`${timezoneAbbr} (${userTimezone})`}
      />

      <Text style={styles.label}>Event Type</Text>
      <View style={styles.typeRow}>
        {["online", "in-person"].map((type) => (
          <Pressable
            key={type}
            style={[
              styles.typeBtn,
              form.event_type === type && styles.typeBtnActive,
            ]}
            onPress={() => setField("event_type", type)}
          >
            <Text
              style={[
                styles.typeBtnText,
                form.event_type === type && styles.typeBtnTextActive,
              ]}
            >
              {type === "online" ? "Online" : "In-Person"}
            </Text>
          </Pressable>
        ))}
      </View>

      {form.event_type === "online" ? (
        <FormField
          label="Event Link (Online)"
          value={form.event_link}
          onChangeText={(v) => setField("event_link", v)}
          placeholder="https://zoom.com/meeting"
          autoCapitalize="none"
          error={errors.event_link}
        />
      ) : (
        <FormField
          label="Event Location (In-Person)"
          value={form.event_location}
          onChangeText={(v) => setField("event_location", v)}
          placeholder="123 Street, City, Country"
          error={errors.event_location}
        />
      )}

      <FormField
        label="Host Email"
        value={form.event_host_email}
        onChangeText={(v) => setField("event_host_email", v)}
        placeholder="host@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormField
        label="Event Host Name"
        value={form.event_host_name}
        onChangeText={(v) => setField("event_host_name", v)}
        placeholder="Rayhana Rahman"
        error={errors.event_host_name}
      />

      <FormField
        label="Duration (minutes)"
        value={form.duration}
        onChangeText={(v) => setField("duration", v)}
        placeholder="e.g., 60"
        keyboardType="number-pad"
      />

      <FormField
        label="Tags"
        value={form.tags}
        onChangeText={(v) => setField("tags", v)}
        placeholder="e.g., AI, Tech, Community"
        helperText="Separate tags with commas"
      />

      <View style={styles.actions}>
        {isEditMode && (
          <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={isLoading}>
            <Text style={styles.deleteBtnText}>Delete Event</Text>
          </Pressable>
        )}
        <Pressable
          style={commonStyles.secondaryButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[commonStyles.primaryButton, isLoading && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={commonStyles.primaryButtonText}>
            {isLoading
              ? isEditMode
                ? "Updating Event..."
                : "Creating Event..."
              : isEditMode
              ? "Update Event"
              : "Create Event 🎉"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontWeight: "600",
    color: colors.secondary,
  },
  typeBtnTextActive: {
    color: colors.white,
  },
  banner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerSuccess: {
    backgroundColor: colors.accent,
  },
  bannerError: {
    backgroundColor: "#f8d7da",
  },
  bannerText: {
    color: colors.primary,
    fontWeight: "500",
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  deleteBtn: {
    backgroundColor: "#fdd9d9",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtnText: {
    color: colors.primary,
    fontWeight: "600",
  },
});
