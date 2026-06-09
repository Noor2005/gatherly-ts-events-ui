import { useCallback } from "react";
import {
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  formatEventDateTime,
  getRelativeDate,
  getTimeUntilEvent,
} from "../../src/utils/TimeZoneUtils";
import { colors } from "../theme/colors";

const SHARE_BASE_URL = "https://your-app-domain.com/events";

export default function EventCard({ event, onViewDetails }) {
  const { time, dateObject } = formatEventDateTime(event.eventDateTime);
  const relativeDate = getRelativeDate(event.eventDateTime);
  const timeUntil = getTimeUntilEvent(event.eventDateTime);
  const tags = event.tags ? event.tags.split(",").map((tag) => tag.trim()) : [];

  const checkPastEvent = useCallback(() => {
    if (!dateObject || !event.duration) return false;
    const eventEnd = new Date(dateObject.getTime() + event.duration * 60000);
    return new Date() > eventEnd;
  }, [dateObject, event.duration]);

  const isLiveEvent = useCallback(() => {
    if (!event.eventDateTime || !event.duration) return false;
    const start = new Date(event.eventDateTime);
    const end = new Date(start.getTime() + event.duration * 60000);
    const now = new Date();
    return now >= start && now <= end;
  }, [event.eventDateTime, event.duration]);

  const isPast = checkPastEvent();
  const shareUrl = `${SHARE_BASE_URL}/${event.eventId}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Join this event! ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.log("Share canceled or failed:", error);
    }
  };

  const handleJoinNow = () => {
    if (event.eventLink) {
      Linking.openURL(event.eventLink);
    }
  };

  const shortDesc = event.shortDescription || "";
  const truncated = shortDesc.length > 40;

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.header}>
        <Text style={[styles.title, isPast && styles.titlePast]} numberOfLines={2}>
          {event.title}
        </Text>
        {event.eventType === "online" && isLiveEvent() ? (
          <Pressable style={styles.joinNow} onPress={handleJoinNow}>
            <Text style={styles.joinNowText}>Join Now</Text>
          </Pressable>
        ) : (
          !isPast && (
            <View style={styles.timeUntil}>
              <Text style={styles.timeUntilText}>⏳ {timeUntil}</Text>
            </View>
          )
        )}
      </View>

      <Text style={styles.description}>
        {truncated ? `${shortDesc.slice(0, 40)}... ` : shortDesc}
        {truncated && (
          <Text style={styles.seeMore} onPress={() => onViewDetails?.(event.eventId)}>
            See more
          </Text>
        )}
      </Text>

      <View style={styles.details}>
        <Text style={styles.detailItem}>📅 {relativeDate}</Text>
        <Text style={styles.detailItem}>⏰ {time}</Text>
        <Text style={styles.detailItem}>👥 {event.allRSVPs || 0}</Text>
      </View>

      <View style={styles.organizer}>
        <Text style={styles.organizerLabel}>Host: </Text>
        <Text style={styles.organizerName}>{event.eventHostName}</Text>
      </View>

      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag, index) => (
            <View key={`${tag}-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </Pressable>
        <Pressable
          style={styles.detailsButton}
          onPress={() => onViewDetails?.(event.eventId)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.lightBlue,
    gap: 14,
  },
  cardPast: {
    opacity: 0.7,
    backgroundColor: "#fafafa",
  },
  header: {
    minHeight: 48,
    paddingRight: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    lineHeight: 28,
  },
  titlePast: {
    color: colors.text,
  },
  timeUntil: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.pink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fcc7c7",
  },
  timeUntilText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  joinNow: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.joinNow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinNowText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 13,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.bodyText,
  },
  seeMore: {
    color: colors.link,
    fontSize: 14,
    fontWeight: "600",
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingVertical: 14,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.lightBlue,
  },
  detailItem: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  organizer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  organizerLabel: {
    color: colors.text,
    fontSize: 14,
  },
  organizerName: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  shareButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  shareButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  detailsButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 13,
  },
});
