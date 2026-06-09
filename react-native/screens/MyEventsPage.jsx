import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import EventsCarousel from "../components/EventsCarousel";
import LoadingComponent from "../components/LoadingComponent";
import eventService from "../services/EventService";
import { commonStyles } from "../theme/commonStyles";

export default function MyEventsPage({ navigation }) {
  const [activeTab, setActiveTab] = useState("created");
  const [loading, setLoading] = useState(true);
  const [myCreatedEvents, setMyCreatedEvents] = useState([]);
  const [myRsvps, setMyRsvps] = useState([]);
  const [pageSize] = useState(3);
  const [createdTotalPages, setCreatedTotalPages] = useState(0);
  const [createdTotalElements, setCreatedTotalElements] = useState(0);
  const [rsvpsTotalPages, setRsvpsTotalPages] = useState(0);
  const [rsvpTotalElements, setRsvpTotalElements] = useState(0);

  const createdPageRef = useRef(0);
  const rsvpsPageRef = useRef(0);
  const hasFetchedCreated = useRef(false);
  const hasFetchedRsvps = useRef(false);

  useEffect(() => {
    if (activeTab === "created" && !hasFetchedCreated.current) {
      fetchCreatedEvents(0);
    } else if (activeTab === "rsvps" && !hasFetchedRsvps.current) {
      fetchRsvps(0);
    }
  }, [activeTab]);

  const fetchCreatedEvents = async (page) => {
    try {
      if (page === 0) setLoading(true);
      const created = await eventService.getMyCreatedEvents(page, pageSize);

      if (created?.events) {
        setMyCreatedEvents((prev) => {
          if (page === 0) return created.events;
          const combined = [...prev, ...created.events];
          return Array.from(
            new Map(combined.map((e) => [e.eventId, e])).values(),
          );
        });
        setCreatedTotalPages(created.totalPages || 0);
        setCreatedTotalElements(created.totalElements || 0);
        createdPageRef.current = page;
      }
      hasFetchedCreated.current = true;
    } catch (err) {
      console.error("Error loading created events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRsvps = async (page) => {
    try {
      if (page === 0) setLoading(true);
      const rsvps = await eventService.getMyRSVPs(page, pageSize);

      if (rsvps?.events) {
        setMyRsvps((prev) => {
          if (page === 0) return rsvps.events;
          const combined = [...prev, ...rsvps.events];
          return Array.from(
            new Map(combined.map((e) => [e.eventId, e])).values(),
          );
        });
        setRsvpsTotalPages(rsvps.totalPages || 0);
        setRsvpTotalElements(rsvps.totalElements || 0);
        rsvpsPageRef.current = page;
      }
      hasFetchedRsvps.current = true;
    } catch (err) {
      console.error("Error loading RSVPs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReachEnd = useCallback(() => {
    if (
      activeTab === "created" &&
      createdPageRef.current + 1 < createdTotalPages
    ) {
      return fetchCreatedEvents(createdPageRef.current + 1);
    }
    if (activeTab === "rsvps" && rsvpsPageRef.current + 1 < rsvpsTotalPages) {
      return fetchRsvps(rsvpsPageRef.current + 1);
    }
  }, [activeTab, createdTotalPages, rsvpsTotalPages]);

  const handleViewDetails = useCallback(
    (eventId) => navigation.navigate("EventDetails", { eventId }),
    [navigation],
  );

  if (loading) {
    return (
      <View style={[commonStyles.screen, { justifyContent: "center" }]}>
        <LoadingComponent />
      </View>
    );
  }

  const activeList = activeTab === "created" ? myCreatedEvents : myRsvps;

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={commonStyles.sectionTitle}>
        {activeTab === "created" ? "My Created Events" : "My RSVPs"}
      </Text>

      <View style={commonStyles.filterControls}>
        <Pressable
          style={[
            commonStyles.filterButton,
            activeTab === "created" && commonStyles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("created")}
        >
          <Text
            style={[
              commonStyles.filterButtonText,
              activeTab === "created" && commonStyles.filterButtonTextActive,
            ]}
          >
            🎨 Created Events ({createdTotalElements})
          </Text>
        </Pressable>

        <Pressable
          style={[
            commonStyles.filterButton,
            activeTab === "rsvps" && commonStyles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("rsvps")}
        >
          <Text
            style={[
              commonStyles.filterButtonText,
              activeTab === "rsvps" && commonStyles.filterButtonTextActive,
            ]}
          >
            📨 My RSVPs ({rsvpTotalElements})
          </Text>
        </Pressable>
      </View>

      {activeList.length > 0 ? (
        <EventsCarousel
          events={activeList}
          onReachEnd={handleReachEnd}
          onViewDetails={handleViewDetails}
          listKey={activeTab}
        />
      ) : (
        <View style={commonStyles.emptyState}>
          <Text style={commonStyles.emptyText}>
            {activeTab === "created"
              ? "You haven't created any events yet."
              : "You haven't RSVP'd to any events yet."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
