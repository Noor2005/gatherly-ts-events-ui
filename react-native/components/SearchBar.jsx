import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors } from "../theme/colors";

export default function SearchBar({ value, onChangeText, onClear, isSearching }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconSlot}>
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.secondary} />
        ) : (
          <View style={styles.searchIcon} />
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Search events, keywords, topics..."
        placeholderTextColor={colors.text}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value ? (
        <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={8}>
          <View style={styles.clearIcon} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    backgroundColor: colors.white,
  },
  iconSlot: {
    width: 24,
    marginRight: 8,
    alignItems: "center",
  },
  searchIcon: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 7,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.primary,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    width: 12,
    height: 12,
    backgroundColor: colors.text,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
});
