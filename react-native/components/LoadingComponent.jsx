import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import LoadingText from "./LoadingText";

export default function LoadingComponent() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <LoadingText />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.secondary,
  },
});
