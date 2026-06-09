import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AddEventForm from "../screens/AddEventForm";
import EventDetailsPage from "../screens/EventDetailsPage";
import Login from "../screens/Login";
import { setUnauthorizedHandler } from "../services/api";
import authService from "../services/AuthService";
import { colors } from "../theme/colors";
import ProtectedScreen from "./ProtectedScreen";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authService.initAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={(nav) => {
        setUnauthorizedHandler(() => {
          nav?.reset({ index: 0, routes: [{ name: "Login" }] });
        });
      }}
    >
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: "Sign in" }}
        />
        <Stack.Screen
          name="EventDetails"
          component={EventDetailsPage}
          options={{ title: "Event Details" }}
        />
        <Stack.Screen name="CreateEvent" options={{ title: "Create Event" }}>
          {(props) => (
            <ProtectedScreen navigation={props.navigation}>
              <AddEventForm {...props} />
            </ProtectedScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="EditEvent" options={{ title: "Edit Event" }}>
          {(props) => (
            <ProtectedScreen navigation={props.navigation}>
              <AddEventForm {...props} />
            </ProtectedScreen>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
