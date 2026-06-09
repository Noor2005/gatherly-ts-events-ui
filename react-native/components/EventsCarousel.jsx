import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import EventCard from "./EventCard";

const HORIZONTAL_PADDING = 20;
const CARD_GAP = 20;
const screenWidth = Dimensions.get("window").width;
export const CARD_WIDTH = screenWidth - HORIZONTAL_PADDING * 2;

export default function EventsCarousel({
  events,
  onReachEnd,
  onViewDetails,
  listKey,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
      setActiveIndex(index);

      if (index >= events.length - 1 && !loadingMoreRef.current) {
        loadingMoreRef.current = true;
        Promise.resolve(onReachEnd?.()).finally(() => {
          loadingMoreRef.current = false;
        });
      }
    },
    [events.length, onReachEnd],
  );

  return (
    <View>
      <FlatList
        ref={listRef}
        key={listKey}
        data={events}
        keyExtractor={(item) => String(item.eventId)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <EventCard event={item} onViewDetails={onViewDetails} />
          </View>
        )}
      />

      <View style={styles.pagination}>
        {events.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 8,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  dotActive: {
    backgroundColor: "#222",
  },
});
