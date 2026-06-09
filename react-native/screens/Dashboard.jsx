import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import EventsCarousel from "../components/EventsCarousel";
import LoadingComponent from "../components/LoadingComponent";
import SearchBar from "../components/SearchBar";
import eventService from "../services/EventService";
import { commonStyles } from "../theme/commonStyles";

export default function Dashboard({ navigation }) {
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("UPCOMING");
  const [pageSize] = useState(3);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentPageRef = useRef(0);
  const debounceTimer = useRef(null);

  useEffect(() => {
    fetchEvents(0, activeTab, searchQuery);
  }, []);

  useEffect(() => {
    currentPageRef.current = 0;
    setAllEvents([]);
    fetchEvents(0, activeTab, searchQuery);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setIsSearching(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 800);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  const fetchEvents = async (page, type = "UPCOMING", query = "") => {
    try {
      if (page === 0) setIsLoading(true);
      setError(null);

      const response = await eventService.getAllEvents(page, pageSize, type, query);

      if (response.success && response.events) {
        setAllEvents((prev) => {
          if (page === 0) return response.events;
          const combined = [...prev, ...response.events];
          return Array.from(
            new Map(combined.map((e) => [e.eventId, e])).values(),
          );
        });
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
        currentPageRef.current = page;
      } else if (response.events?.length === 0) {
        setAllEvents([]);
        setTotalPages(0);
        setTotalElements(0);
      } else {
        setError(response.message || "No events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleReachEnd = useCallback(() => {
    if (currentPageRef.current + 1 < totalPages) {
      return fetchEvents(currentPageRef.current + 1, activeTab, searchQuery);
    }
  }, [activeTab, searchQuery, totalPages]);

  const handleViewDetails = useCallback(
    (eventId) => navigation.navigate("EventDetails", { eventId }),
    [navigation],
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.screen, { justifyContent: "center" }]}>
        <LoadingComponent />
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.errorState}>
        <Text style={commonStyles.errorText}>⚠️ {error}</Text>
        <Pressable
          style={commonStyles.retryButton}
          onPress={() => fetchEvents(0, activeTab, searchQuery)}
        >
          <Text style={commonStyles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={commonStyles.sectionTitle}>
        {activeTab === "UPCOMING" ? "Upcoming Events" : "Past Events"}
      </Text>
      <Text style={commonStyles.subtitle}>{totalElements} event(s)</Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20, alignItems: "stretch" }}>
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          onClear={() => {
            setSearchInput("");
            setSearchQuery("");
          }}
          isSearching={isSearching}
        />
      </View>

      <View style={[commonStyles.filterControls, { marginBottom: 20 }]}>
        <Pressable
          style={[
            commonStyles.filterButton,
            activeTab === "UPCOMING" && commonStyles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("UPCOMING")}
        >
          <Text
            style={[
              commonStyles.filterButtonText,
              activeTab === "UPCOMING" && commonStyles.filterButtonTextActive,
            ]}
          >
            Upcoming
          </Text>
        </Pressable>
        <Pressable
          style={[
            commonStyles.filterButton,
            activeTab === "PAST" && commonStyles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("PAST")}
        >
          <Text
            style={[
              commonStyles.filterButtonText,
              activeTab === "PAST" && commonStyles.filterButtonTextActive,
            ]}
          >
            Past
          </Text>
        </Pressable>
      </View>

      {allEvents.length === 0 ? (
        <View style={commonStyles.emptyState}>
          <Text style={commonStyles.emptyText}>
            {activeTab === "PAST"
              ? "📭 No past events to show"
              : "🎉 No upcoming events at the moment"}
          </Text>
        </View>
      ) : (
        <EventsCarousel
          events={allEvents}
          onReachEnd={handleReachEnd}
          onViewDetails={handleViewDetails}
          listKey={`${activeTab}-${searchQuery}`}
        />
      )}
    </ScrollView>
  );
}
