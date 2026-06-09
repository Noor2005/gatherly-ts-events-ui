import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AlertBanner from "../components/AlertBanner";
import authService from "../services/AuthService";
import { colors } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";

const OTP_COUNTDOWN_SECONDS = 30;

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState({ isError: false, message: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [alertInfo, setAlertInfo] = useState({ show: false, severity: "success", message: "" });
  const otpRefs = useRef([]);

  const isAuthed = authService.isAuthenticated();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (value) => {
    if (!value) return { isError: true, message: "Email is required" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isError: true, message: "Invalid email format" };
    }
    return { isError: false, message: "" };
  };

  const handleSendOtp = async () => {
    const validation = validateEmail(email);
    setError(validation);
    if (validation.isError) return;

    setIsSending(true);
    setAlertInfo({ show: false, message: "" });

    try {
      const response = await authService.sendOtp(email);
      const isSuccess = response.data.success;

      setAlertInfo({
        show: true,
        severity: isSuccess ? "success" : "error",
        message:
          response.data.message ||
          (isSuccess
            ? "An OTP has been sent to your email."
            : "Failed to send OTP. Please try again."),
      });

      if (!isSuccess) return;

      setOtpSent(true);
      setCountdown(OTP_COUNTDOWN_SECONDS);
    } catch (err) {
      setAlertInfo({
        show: true,
        severity: "error",
        message: err.message || "Failed to send OTP. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getSendOtpBtnText = () => {
    if (isSending) return "Sending...";
    if (countdown > 0) return `Resend in ${countdown}`;
    if (otpSent) return "Resend OTP";
    return "Send OTP";
  };

  const handleOtpChange = (value, index) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const chars = otp.split("");
    chars[index] = digit;
    const next = chars.join("").slice(0, 6);
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    setAlertInfo({ show: false, message: "" });

    try {
      const response = await authService.loginWithOtp(email, otp);
      const isSuccess = response.data.success;

      if (!isSuccess) {
        setAlertInfo({
          show: true,
          severity: "error",
          message:
            response.data.message ||
            "Error in authentication. Please try again.",
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (err) {
      setAlertInfo({
        show: true,
        severity: "error",
        message: err.message || "Failed to login. Please try again.",
      });
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setOtpSent(false);
    setOtp("");
    setEmail("");
    Alert.alert("Logged out", "You have been signed out.");
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  if (isAuthed) {
    return (
      <ScrollView style={commonStyles.screen} contentContainerStyle={styles.accountContent}>
        <Text style={commonStyles.sectionTitle}>Account</Text>
        <Text style={styles.accountName}>{authService.getUserName()}</Text>
        <Text style={styles.accountEmail}>{authService.getUserEmail()}</Text>
        <Pressable style={[commonStyles.primaryButton, { marginTop: 24 }]} onPress={handleLogout}>
          <Text style={commonStyles.primaryButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={commonStyles.screen} keyboardShouldPersistTaps="handled">
        <Text style={commonStyles.sectionTitle}>Sign in</Text>
        <Text style={styles.hint}>Enter your registered Tech Sisters email</Text>

        <AlertBanner
          severity={alertInfo.severity}
          message={alertInfo.show ? alertInfo.message : ""}
          onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        />

        <Text style={styles.label}>Email</Text>
        <View style={styles.emailRow}>
          <TextInput
            style={[styles.input, styles.emailInput, error.isError && styles.inputError]}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error.isError) setError(validateEmail(v));
            }}
            onBlur={() => setError(validateEmail(email))}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!otpSent}
            placeholder="you@example.com"
            placeholderTextColor={colors.text}
          />
          <Pressable
            style={[styles.otpBtn, (isSending || countdown > 0 || error.isError) && styles.otpBtnDisabled]}
            onPress={handleSendOtp}
            disabled={isSending || countdown > 0 || error.isError}
          >
            <Text style={styles.otpBtnText}>{getSendOtpBtnText()}</Text>
          </Pressable>
        </View>
        {error.isError ? <Text style={styles.fieldError}>{error.message}</Text> : null}

        {otpSent && (
          <View style={styles.otpSection}>
            <Text style={styles.label}>Enter the 6-digit OTP</Text>
            <View style={styles.otpRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  style={styles.otpBox}
                  value={otp[i] || ""}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
            <Pressable
              style={[commonStyles.primaryButton, otp.length !== 6 && styles.disabled]}
              onPress={handleSubmit}
              disabled={otp.length !== 6}
            >
              <Text style={commonStyles.primaryButtonText}>Sign In</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hint: {
    textAlign: "center",
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 6,
  },
  emailRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primary,
  },
  emailInput: {
    flex: 1,
  },
  inputError: {
    borderColor: "#e57373",
  },
  fieldError: {
    color: "#c62828",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  otpBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  otpBtnDisabled: {
    opacity: 0.5,
  },
  otpBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  otpSection: {
    marginTop: 20,
    gap: 12,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 48,
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  accountContent: {
    alignItems: "center",
    paddingTop: 40,
  },
  accountName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
});
