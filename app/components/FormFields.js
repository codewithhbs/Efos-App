// src/components/FormFields.js
// Shared inputs — AuthScreens aur ResumeBuilder dono yahi use karte hain.

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const C = {
  primary: "#E53935",
  primaryDark: "#B71C1C",
  primaryLight: "#FFEBEE",
  bg: "#FFFFFF",
  white: "#FFFFFF",
  card: "#F9F9F9",
  text: "#0F172A",
  textSec: "#64748B",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#E53935",
};

export const F = { xs: 11, sm: 13, base: 14, md: 15, lg: 17, xl: 20 };

const ease = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export const Row = ({ children }) => <View style={s.row}>{children}</View>;
export const Col = ({ children }) => <View style={s.col}>{children}</View>;

export const Label = ({ text, required }) => (
  <Text style={s.label}>
    {text}
    {required ? <Text style={{ color: C.error }}> *</Text> : null}
  </Text>
);

export const Section = ({ title }) => (
  <View style={s.section}>
    <View style={s.sectionBar} />
    <Text style={s.sectionTxt}>{title}</Text>
  </View>
);

// ─── TEXT FIELD ───────────────────────────────────────────────
export function Field({
  label,
  required,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  rightEl,
  editable = true,
  autoCapitalize = "none",
  maxLength,
  multiline = false,
}) {
  const [focused, setFocused] = useState(false);
  const bAnim = useRef(new Animated.Value(0)).current;

  const anim = (to) =>
    Animated.timing(bAnim, {
      toValue: to,
      duration: 160,
      useNativeDriver: false,
    }).start();

  const borderColor = bAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.error : C.border, error ? C.error : C.primary],
  });
  const bw = bAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });

  return (
    <View style={s.wrap}>
      {!!label && <Label text={label} required={required} />}

      <Animated.View
        style={[
          s.box,
          multiline && s.boxMultiline,
          { borderColor, borderWidth: bw },
        ]}
      >
        {!!icon && (
          <Ionicons
            name={icon}
            size={17}
            color={error ? C.error : focused ? C.primary : C.textLight}
            style={[s.icon, multiline && { marginTop: 2 }]}
          />
        )}

        <TextInput
          style={[s.input, multiline && s.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={C.textLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          value={value != null ? String(value) : ""}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
            anim(1);
          }}
          onBlur={() => {
            setFocused(false);
            anim(0);
          }}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />

        {rightEl}
      </Animated.View>

      {!!error && <ErrTxt msg={error} />}
    </View>
  );
}

// ─── SELECT FIELD (custom dropdown, no native Picker) ─────────
export function SelectField({
  label,
  required,
  icon,
  placeholder = "Select",
  value,
  onValueChange,
  options = [],
  error,
  disabled = false,
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const locked = disabled || !options.length;

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [options]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const toggle = () => {
    if (locked) return;
    Keyboard.dismiss();
    ease();
    setOpen((o) => !o);
    setQuery("");
  };

  const pick = (o) => {
    ease();
    onValueChange(o.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={s.wrap}>
      {!!label && <Label text={label} required={required} />}

      <Pressable
        onPress={toggle}
        style={[
          s.box,
          {
            borderWidth: open ? 2 : 1,
            borderColor: error ? C.error : open ? C.primary : C.border,
            opacity: locked ? 0.55 : 1,
          },
          open && s.boxOpen,
        ]}
      >
        {!!icon && (
          <Ionicons
            name={icon}
            size={17}
            color={error ? C.error : open ? C.primary : C.textLight}
            style={s.icon}
          />
        )}

        <Text
          style={[s.input, { color: selected ? C.text : C.textLight }]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={open ? C.primary : C.textLight}
        />
      </Pressable>

      {open && (
        <View style={s.panel}>
          {searchable && (
            <View style={s.search}>
              <Ionicons name="search-outline" size={14} color={C.textLight} />
              <TextInput
                style={s.searchInput}
                placeholder="Search..."
                placeholderTextColor={C.textLight}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color={C.textLight} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView
            style={s.list}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <Text style={s.empty}>No results</Text>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <TouchableOpacity
                    key={String(o.value)}
                    style={[s.item, active && s.itemActive]}
                    onPress={() => pick(o)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[s.itemTxt, active && s.itemTxtActive]}
                      numberOfLines={1}
                    >
                      {o.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={15} color={C.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {!!error && <ErrTxt msg={error} />}
    </View>
  );
}

const ErrTxt = ({ msg }) => (
  <View style={s.err}>
    <Ionicons name="alert-circle" size={12} color={C.error} />
    <Text style={s.errTxt}>{msg}</Text>
  </View>
);

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1, minWidth: 0 },

  section: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 4 },
  sectionBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: C.primary },
  sectionTxt: { fontSize: F.xs, fontWeight: "800", color: C.textSec, letterSpacing: 1 },

  wrap: { gap: 4, marginBottom: 12 },
  label: { fontSize: F.xs, fontWeight: "700", color: C.textSec, marginLeft: 2 },

  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    minHeight: 46,
  },
  boxMultiline: { alignItems: "flex-start", minHeight: 100, paddingVertical: 12 },
  boxOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },

  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: F.base, color: C.text, padding: 0 },
  inputMultiline: { minHeight: 76, textAlignVertical: "top" },

  err: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 2 },
  errTxt: { fontSize: F.xs, color: C.error, flex: 1 },

  panel: {
    marginTop: -4,
    backgroundColor: C.white,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  searchInput: { flex: 1, fontSize: F.sm, color: C.text, padding: 0 },
  list: { maxHeight: 190 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemActive: { backgroundColor: C.primaryLight },
  itemTxt: { flex: 1, fontSize: F.sm, color: C.text },
  itemTxtActive: { fontWeight: "800", color: C.primaryDark },
  empty: { fontSize: F.sm, color: C.textLight, textAlign: "center", paddingVertical: 16 },
});