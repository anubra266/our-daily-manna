import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import {
  useAccentColor,
  ACCENT_PRESETS,
  getAccentForPreset,
} from "@/contexts/accent-color";
import { usePreferredCategory } from "@/hooks/use-preferred-category";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatReminderTime, useReminderTime } from "@/hooks/use-reminder-time";
import {
  DEVOTIONAL_CATEGORY_LABELS,
  DEVOTIONAL_CATEGORY_AUDIENCE,
} from "@/lib/types/devotional";
import type { DevotionalCategory } from "@/lib/types/devotional";
import { ThemedText } from "@/components/themed-text";

const CATEGORIES: DevotionalCategory[] = [
  "sincere-milk",
  "higher-everyday",
  "daily-manna",
];

function reminderTimeToDate(t: { hour: number; minute: number } | null): Date {
  const d = new Date();
  if (t) {
    d.setHours(t.hour, t.minute, 0, 0);
  } else {
    d.setHours(7, 0, 0, 0);
  }
  return d;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { accent, selectedPresetId, setAccent } = useAccentColor();
  const { preferredCategory, setPreferredCategory } = usePreferredCategory();
  const { reminderTime, setReminderTime, isLoaded } = useReminderTime();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const reminderOn = reminderTime !== null;
  const pickerDate = reminderTimeToDate(reminderTime);
  const sheetBg = colorScheme === "dark" ? "#1C1C1E" : "#F2F2F7";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Accent color */}
      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>
          Accent color
        </ThemedText>
        <ThemedText style={styles.sectionFooter}>
          Light and dark variants so accents look right in each mode.
        </ThemedText>
        <View style={styles.accentRow}>
          {ACCENT_PRESETS.map((preset) => {
            const chipColor = getAccentForPreset(preset.id, isDark);
            const isSelected =
              selectedPresetId === preset.id ||
              (selectedPresetId === null && accent === chipColor);
            return (
              <Pressable
                key={preset.id}
                style={[
                  styles.accentChip,
                  { backgroundColor: chipColor },
                  isSelected && styles.accentChipSelected,
                ]}
                onPress={() => setAccent(preset.id)}
              >
                {isSelected ? (
                  <ThemedText style={styles.accentCheck}>✓</ThemedText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Preferred category — grouped list */}
      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>
          Preferred category
        </ThemedText>
        <ThemedText style={styles.sectionFooter}>
          Used for Home and notifications.
        </ThemedText>
        <View style={styles.group}>
          {CATEGORIES.map((slug, index) => (
            <Pressable
              key={slug}
              style={({ pressed }) => [
                styles.row,
                index < CATEGORIES.length - 1 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
              onPress={() => setPreferredCategory(slug)}
            >
              <View style={styles.rowLabelWrap}>
                <ThemedText style={styles.rowLabel}>
                  {DEVOTIONAL_CATEGORY_LABELS[slug]}
                </ThemedText>
                <ThemedText style={styles.rowSubcaption}>
                  {DEVOTIONAL_CATEGORY_AUDIENCE[slug]}
                </ThemedText>
              </View>
              {preferredCategory === slug ? (
                <View style={[styles.checkmark, { backgroundColor: accent }]}>
                  <ThemedText style={styles.checkmarkIcon}>✓</ThemedText>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      {isLoaded && (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>
            Daily reminder
          </ThemedText>
          <ThemedText style={styles.sectionFooter}>
            Get a notification at your chosen time.
          </ThemedText>
          <View style={styles.group}>
            <View style={[styles.row, styles.rowBorder]}>
              <ThemedText style={styles.rowLabel}>Daily reminder</ThemedText>
              <Switch
                value={reminderOn}
                onValueChange={(on) =>
                  setReminderTime(on ? { hour: 7, minute: 0 } : null)
                }
                trackColor={{ false: "rgba(0,0,0,0.16)", true: accent }}
                thumbColor="#fff"
              />
            </View>
            {reminderOn && (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <ThemedText style={styles.rowLabel}>Time</ThemedText>
                <ThemedText style={[styles.rowValue, { color: accent }]}>
                  {reminderTime ? formatReminderTime(reminderTime) : "—"}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {showTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          onChange={(_, date) => {
            setShowTimePicker(false);
            if (date) {
              setReminderTime({
                hour: date.getHours(),
                minute: date.getMinutes(),
              });
            }
          }}
        />
      )}
      {showTimePicker && Platform.OS === "ios" && (
        <Modal visible transparent animationType="fade" style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={[styles.modalContent, { backgroundColor: sheetBg }]}>
              <View style={[styles.modalBar, { backgroundColor: sheetBg }]}>
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  hitSlop={12}
                >
                  <ThemedText style={[styles.modalButton, { color: accent }]}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <ThemedText type="defaultSemiBold">Reminder time</ThemedText>
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  hitSlop={12}
                >
                  <ThemedText style={[styles.modalButton, { color: accent }]}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={(_, date) => {
                  if (date) {
                    setReminderTime({
                      hour: date.getHours(),
                      minute: date.getMinutes(),
                    });
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 28 },
  sectionHeader: { marginBottom: 8, paddingHorizontal: 4 },
  sectionFooter: {
    fontSize: 13,
    opacity: 0.65,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  rowPressed: { opacity: 0.7 },
  rowLabelWrap: { flex: 1 },
  rowLabel: { fontSize: 16 },
  rowSubcaption: { fontSize: 13, opacity: 0.65, marginTop: 2 },
  rowValue: { fontSize: 16, opacity: 0.65 },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkIcon: { color: "#fff", fontSize: 14, fontWeight: "600" },
  accentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 4,
  },
  accentChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  accentChipSelected: {
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
  },
  accentCheck: { color: "#fff", fontSize: 18, fontWeight: "700" },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
    paddingTop: 12,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  presetChipActive: {},
  presetChipText: { fontSize: 14 },
  presetChipTextActive: { fontSize: 14, color: "#fff" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "transparent",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalButton: { fontSize: 17 },
});
