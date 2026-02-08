import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
} from 'expo-glass-effect';
import { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { StyleSheet, View, type ViewStyle } from 'react-native';

const GlassContext = createContext(false);

const useGlass = () =>
  Platform.OS === 'ios' && isGlassEffectAPIAvailable();

type GlassContainerRowProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Distance at which glass elements start merging. */
  spacing?: number;
};

/** Wraps pill row in GlassContainer when available so glass effects merge. */
export function GlassContainerRow({
  children,
  style,
  spacing = 10,
}: GlassContainerRowProps) {
  const available = useGlass();

  if (available) {
    return (
      <GlassContext.Provider value={true}>
        <GlassContainer spacing={spacing} style={[styles.row, style]}>
          {children}
        </GlassContainer>
      </GlassContext.Provider>
    );
  }

  return (
    <GlassContext.Provider value={false}>
      <View style={[styles.row, style]}>{children}</View>
    </GlassContext.Provider>
  );
}

type GlassPillProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Used when glass is not available (non-iOS or API unavailable). */
  fallbackBackgroundColor?: string;
  /** Optional tint for the glass (iOS 26+). */
  tintColor?: string;
  isInteractive?: boolean;
};

export function GlassPill({
  children,
  style,
  fallbackBackgroundColor = 'rgba(255,255,255,0.12)',
  tintColor,
  isInteractive = false,
}: GlassPillProps) {
  const insideContainer = useContext(GlassContext);
  const available = useGlass();
  const useGlassView = available && insideContainer;

  if (useGlassView) {
    return (
      <GlassView
        style={[styles.pill, style]}
        glassEffectStyle="clear"
        tintColor={tintColor}
        isInteractive={isInteractive}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[styles.pill, style, { backgroundColor: fallbackBackgroundColor }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
