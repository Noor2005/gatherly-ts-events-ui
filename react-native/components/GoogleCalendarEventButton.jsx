import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

export default function GoogleCalendarEventButton({ eventLink }) {
  if (!eventLink) return null;

  return (
    <Pressable
      style={styles.button}
      onPress={() => Linking.openURL(eventLink)}
    >
      <Text style={styles.icon}>📅</Text>
      <Text style={styles.label}>Add to Calendar</Text>
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
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
