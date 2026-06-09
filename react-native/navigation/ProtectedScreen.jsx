import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import authService from "../services/AuthService";
import { colors } from "../theme/colors";

export default function ProtectedScreen({ navigation, children }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await authService.initAuth();
      if (!mounted) return;
      const ok = authService.isAuthenticated();
      setAuthed(ok);
      setReady(true);
      if (!ok) {
        navigation.replace("Login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigation]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!authed) return null;

  return children;
}
