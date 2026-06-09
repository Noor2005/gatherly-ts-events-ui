import { Pressable, Share, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

function buildICS(eventData) {
  const start = new Date(eventData.eventDateTime);
  const end = new Date(start.getTime() + (eventData.duration || 60) * 60000);
  const formatDate = (d) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gatherly//EN",
    "BEGIN:VEVENT",
    `UID:${eventData.eventId}@gatherly`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${eventData.title || "Event"}`,
    `DESCRIPTION:${(eventData.shortDescription || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${eventData.eventLink || eventData.eventLocation || ""}`,
    `ORGANIZER;CN=${eventData.eventHostName}:mailto:${eventData.eventHostEmail || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function DownloadEvent({ eventData }) {
  const handleDownload = async () => {
    const ics = buildICS(eventData);
    const safeTitle = (eventData.title || "event")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    try {
      await Share.share({
        title: `${safeTitle}.ics`,
        message: ics,
      });
    } catch (err) {
      console.log("ICS share failed:", err);
    }
  };

  return (
    <Pressable style={styles.button} onPress={handleDownload}>
      <Text style={styles.icon}>⬇️</Text>
      <Text style={styles.label}>Download Event</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
