import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme/colors";

export default function FormField({
  label,
  error,
  helperText,
  multiline,
  ...inputProps
}) {
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.textarea,
          error && styles.inputError,
        ]}
        placeholderTextColor={colors.text}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
      {helperText && !error ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primary,
    backgroundColor: colors.white,
  },
  textarea: {
    minHeight: 100,
  },
  inputError: {
    borderColor: "#e57373",
  },
  helper: {
    marginTop: 4,
    fontSize: 12,
    color: colors.text,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: "#c62828",
  },
});
