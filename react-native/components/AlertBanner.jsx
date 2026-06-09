import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function AlertBanner({ severity = "info", message, onClose }) {
  if (!message) return null;

  const isError = severity === "error";
  const isSuccess = severity === "success";

  return (
    <View
      style={[
        styles.banner,
        isError && styles.error,
        isSuccess && styles.success,
      ]}
    >
      <Text style={[styles.text, isError && styles.errorText]}>{message}</Text>
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.lightBlue,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  success: {
    backgroundColor: colors.accent,
    borderColor: colors.lightBlue,
  },
  error: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c2c7",
  },
  text: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    color: "#721c24",
  },
  close: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
  },
});
