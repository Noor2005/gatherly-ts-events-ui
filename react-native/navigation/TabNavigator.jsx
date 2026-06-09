import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text } from "react-native";
import AddEventForm from "../screens/AddEventForm";
import Dashboard from "../screens/Dashboard";
import Login from "../screens/Login";
import MyEventsPage from "../screens/MyEventsPage";
import authService from "../services/AuthService";

const Tab = createBottomTabNavigator();

function tabIcon(label) {
  return () => <Text style={{ fontSize: 18 }}>{label}</Text>;
}

export default function TabNavigator() {
  const [isAuthed, setIsAuthed] = useState(authService.isAuthenticated());
  const [isAdmin, setIsAdmin] = useState(authService.isAdmin());

  useFocusEffect(
    useCallback(() => {
      setIsAuthed(authService.isAuthenticated());
      setIsAdmin(authService.isAdmin());
    }, []),
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0f3363",
        tabBarInactiveTintColor: "#747474",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ tabBarIcon: tabIcon("🏠"), title: "Events" }}
      />

      {isAuthed ? (
        <Tab.Screen
          name="MyEvents"
          component={MyEventsPage}
          options={{ tabBarIcon: tabIcon("📋"), title: "My Events" }}
        />
      ) : null}

      {isAdmin ? (
        <Tab.Screen
          name="CreateEvent"
          component={AddEventForm}
          options={{ tabBarIcon: tabIcon("➕"), title: "Create" }}
        />
      ) : null}

      <Tab.Screen
        name={isAuthed ? "Account" : "Login"}
        component={Login}
        options={{
          tabBarIcon: tabIcon(isAuthed ? "👤" : "🔐"),
          title: isAuthed ? "Account" : "Log in",
        }}
      />
    </Tab.Navigator>
  );
}
