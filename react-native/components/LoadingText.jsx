import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function LoadingText({
  text1 = "Activating Sabr mode",
  text2 = "Loading soon Insha Allah",
}) {
  const [currentText, setCurrentText] = useState(text1);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentText((prev) => (prev === text1 ? text2 : text1));
    }, 2000);
    return () => clearInterval(id);
  }, [text1, text2]);

  return (
    <View style={styles.row}>
      <Text style={styles.text}>{currentText}</Text>
      <Text style={styles.dots}> •••</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: "#154481",
    fontWeight: "500",
  },
  dots: {
    fontSize: 18,
    color: "#154481",
  },
});
