import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DownloadEvent from "../components/DownloadEvent";
import GoogleCalendarEventButton from "../components/GoogleCalendarEventButton";
import LoadingComponent from "../components/LoadingComponent";
import authService from "../services/AuthService";
import eventService from "../services/EventService";
import {
  formatEventDateTime,
  getRelativeDate,
  getTimezoneAbbreviation,
} from "../../src/utils/TimeZoneUtils";
import { colors } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";

const SHARE_BASE_URL = "https://your-app-domain.com/events";

export default function EventDetailsPage({ navigation, route }) {
  const eventId = route.params?.eventId;

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
        const dto = res.dto || res.data || res;
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
      navigation.navigate("Login");
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

  const handleShare = async () => {
    const eventUrl = `${SHARE_BASE_URL}/${event.eventId}`;
    try {
      await Share.share({
        title: event.title,
        message: `${event.shortDescription || ""}\n${eventUrl}`,
        url: eventUrl,
      });
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.screen, { justifyContent: "center" }]}>
        <LoadingComponent />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={commonStyles.emptyState}>
        <Text style={commonStyles.emptyText}>Event not found</Text>
      </View>
    );
  }

  const { time } = formatEventDateTime(event.eventDateTime);
  const relativeDate = getRelativeDate(event.eventDateTime);
  const userTimeZone = getTimezoneAbbreviation();
  const isPastEvent = new Date(event.eventDateTime) < new Date();
  const tags = (event.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heroTitle}>{event.title}</Text>

      <View style={styles.metaBlock}>
        <Text style={styles.meta}>👤 By {event.eventHostName}</Text>
        <Text style={styles.meta}>📍 {event.eventLocation || "Online"}</Text>
        <Text style={styles.meta}>
          📅 {relativeDate} · {time} ({userTimeZone})
        </Text>
        <Text style={styles.meta}>
          🕛 {event.duration ? `${event.duration} mins` : "-"}
        </Text>
      </View>

      <View style={styles.separator} />

      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.body}>
        {event.shortDescription || event.short_description || ""}
      </Text>
      {event.long_description || event.longDescription ? (
        <Text style={[styles.body, { marginTop: 12 }]}>
          {event.long_description || event.longDescription}
        </Text>
      ) : null}

      {tags.length > 0 && (
        <View style={styles.tags}>
          <Text style={styles.catLabel}>Category:</Text>
          {tags.map((t, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {isCreator && (
          <Pressable
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() =>
              navigation.navigate("EditEvent", {
                eventId: event.eventId,
                event,
              })
            }
          >
            <Text style={styles.editBtnText}>Edit Event</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.actionBtn, styles.reserveBtn]}
          onPress={handleRSVP}
          disabled={rsvpLoading || isPastEvent || hasRSVPed}
        >
          <Text style={styles.reserveBtnText}>
            {rsvpLoading
              ? "Processing..."
              : hasRSVPed
              ? "Reserved"
              : "Reserve a spot"}
          </Text>
        </Pressable>

        <Pressable style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share Event</Text>
        </Pressable>

        <GoogleCalendarEventButton eventLink={event.googleCalendarLink} />
        <DownloadEvent eventData={event} />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  metaBlock: {
    gap: 8,
  },
  meta: {
    fontSize: 15,
    color: colors.bodyText,
  },
  separator: {
    height: 2,
    backgroundColor: colors.lightBlue,
    marginVertical: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.bodyText,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    alignItems: "center",
  },
  catLabel: {
    fontWeight: "600",
    color: colors.primary,
  },
  tag: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  actions: {
    marginTop: 28,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: colors.pink,
  },
  editBtnText: {
    fontWeight: "600",
    color: colors.primary,
  },
  reserveBtn: {
    backgroundColor: colors.primary,
  },
  reserveBtnText: {
    color: colors.white,
    fontWeight: "600",
  },
  shareBtn: {
    borderWidth: 2,
    borderColor: colors.lightBlue,
  },
  shareBtnText: {
    color: colors.primary,
    fontWeight: "600",
  },
  message: {
    marginTop: 16,
    textAlign: "center",
    color: colors.secondary,
    fontWeight: "600",
  },
});
