import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewProps } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UI } from '../theme/ui';

interface HeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  rightComponent,
  onBackPress,
  style,
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContent}>
        {showBack && (
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backText}>← Voltar</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.centerContent}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightContent}>{rightComponent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: UI.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: UI.colors.borderSoft,
  },
  leftContent: {
    flex: 0.2,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
  },
  rightContent: {
    flex: 0.2,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: UI.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: UI.colors.textMuted,
    marginTop: 2,
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: UI.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
