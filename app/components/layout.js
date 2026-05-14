import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
 
// ─── COLORS (swap with your own COLORS import if needed) ───
const COLORS = {
  primary: '#ca3838',
  primaryDark: '#4b1b1b',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  border: '#E5E7EB',
};
 
// ─── HEADER VARIANTS ───
// 'full'      → logo/brand + right actions (home screen style)
// 'back'      → back button + centered title
// 'title'     → just centered title, no back
// 'backTitle' → back button + title + optional right action
// 'none'      → no header at all

export default function Layout({
  children,
  headerType = 'full',
  title,
  subtitle,
  brand = 'App',
  brandLogo,
  rightActions,
  onBack,
  scrollable = false,
  refreshing = false,
  onRefresh,
  backgroundColor,
  gradientHeader = false,
  headerShadow = true,
  loading = false,
  emptyState,
  scrollViewProps = {},
  safeAreaEdges = ['top', 'bottom'],
  statusBarStyle,
  stickyFooter,
}) {
  const insets = useSafeAreaInsets();
 
  // Auto-detect status bar style
  const barStyle = statusBarStyle
    ? statusBarStyle
    : headerType === 'full' && gradientHeader
    ? 'light-content'
    : 'dark-content';
 
  // ── Header Renderers ──
 
  const renderFullHeader = () => {
    const content = (
      <View style={styles.headerRow}>
        {/* Brand */}
        <View style={styles.brandRow}>
          {brandLogo ? (
            <View style={styles.brandLogoBox}>{brandLogo}</View>
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.brandLogoDefault}
            >
              <Text style={styles.brandLogoLetter}>
                {brand.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View>
            <Text style={[styles.brandName, gradientHeader && { color: '#fff' }]}>
              {brand}
            </Text>
          </View>
        </View>
 
        {/* Right Actions */}
        {rightActions && (
          <View style={styles.rightActions}>
            {rightActions.map((action, i) => (
              <View key={i}>{action}</View>
            ))}
          </View>
        )}
      </View>
    );
 
    if (gradientHeader) {
      return (
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, headerShadow && styles.headerShadow]}
        >
          {content}
        </LinearGradient>
      );
    }
 
    return (
      <View
        style={[
          styles.header,
          { backgroundColor: COLORS.white },
          headerShadow && styles.headerShadow,
        ]}
      >
        {content}
      </View>
    );
  };
 
  const renderBackHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: COLORS.white },
        headerShadow && styles.headerShadow,
      ]}
    >
      <View style={styles.headerRow}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
 
        {/* Title block (centered) */}
        <View style={styles.titleCenter} pointerEvents="none">
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
 
        {/* Spacer to balance back button */}
        <View style={styles.backBtnPlaceholder} />
      </View>
    </View>
  );
 
  const renderTitleHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: COLORS.white },
        headerShadow && styles.headerShadow,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitleLeft} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightActions && (
          <View style={styles.rightActions}>
            {rightActions.map((action, i) => (
              <View key={i}>{action}</View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
 
  const renderBackTitleHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: COLORS.white },
        headerShadow && styles.headerShadow,
      ]}
    >
      <View style={styles.headerRow}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
 
        {/* Title */}
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.headerTitleLeft} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
 
        {/* Right Actions */}
        {rightActions ? (
          <View style={styles.rightActions}>
            {rightActions.map((action, i) => (
              <View key={i}>{action}</View>
            ))}
          </View>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
      </View>
    </View>
  );
 
  const renderHeader = () => {
    switch (headerType) {
      case 'full':      return renderFullHeader();
      case 'back':      return renderBackHeader();
      case 'title':     return renderTitleHeader();
      case 'backTitle': return renderBackTitleHeader();
      case 'none':      return null;
      default:          return renderFullHeader();
    }
  };
 
  // ── Body ──
 
  const bodyBg = backgroundColor || COLORS.background;
 
  const refreshControl =
    onRefresh ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={COLORS.primary}
        colors={[COLORS.primary]}
      />
    ) : undefined;
 
  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
 
    if (emptyState && !children) {
      return <View style={styles.emptyBox}>{emptyState}</View>;
    }
 
    if (scrollable) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            stickyFooter && { paddingBottom: 80 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      );
    }
 
    return (
      <View
        style={[
          styles.body,
          stickyFooter && { paddingBottom: 80 + insets.bottom },
        ]}
      >
        {children}
      </View>
    );
  };
 
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: bodyBg }]}
      edges={safeAreaEdges}
    >
      <StatusBar
        barStyle={barStyle}
        backgroundColor={
          gradientHeader && headerType === 'full'
            ? COLORS.primaryDark
            : COLORS.white
        }
        translucent={false}
      />
 
      {/* Header */}
      {renderHeader()}
 
      {/* Page Body */}
      <View style={[styles.flex, { backgroundColor: bodyBg }]}>
        {renderBody()}
      </View>
 
      {/* Sticky Footer */}
      {stickyFooter && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom || 8 }]}>
          {stickyFooter}
        </View>
      )}
    </SafeAreaView>
  );
}
 
// ─── ICON BUTTON HELPER (use in rightActions) ───
export const HeaderIconButton = ({ icon, onPress, badge, color }) => (
  <TouchableOpacity
    style={styles.iconBtn}
    onPress={onPress}
    activeOpacity={0.7}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  >
    <Ionicons name={icon} size={20} color={color || COLORS.text} />
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {badge > 99 ? '99+' : badge}
        </Text>
      </View>
    ) : null}
  </TouchableOpacity>
);
 
// ======================== STYLES ========================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
 
  // ── Header ──
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    justifyContent: 'center',
    zIndex: 10,
  },
  headerShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  // Full header
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoDefault: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
 
  // Back header
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 36,
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  headerTitleLeft: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 1,
  },
 
  // Right actions
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
 
  // Body
  body: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
 
  // Sticky footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    zIndex: 99,
  },
});