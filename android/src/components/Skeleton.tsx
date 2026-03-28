import React from 'react';
import { StyleSheet, View } from 'react-native';
import { UI } from '../theme/ui';

interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  gap?: number;
}

export function Skeleton({
  width = '100%',
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ itemHeight = 60, gap = 12 }: SkeletonListProps) {
  return (
    <View style={[styles.card, { gap }]}>
      <Skeleton height={itemHeight * 0.6} />
      <Skeleton height={itemHeight * 0.4} width="80%" />
    </View>
  );
}

export function SkeletonList({ count = 5, itemHeight = 60, gap = 12 }: SkeletonListProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} itemHeight={itemHeight} gap={gap} />
      ))}
    </View>
  );
}

export function SkeletonForm() {
  return (
    <View style={styles.form}>
      <Skeleton height={20} width="30%" style={{ marginBottom: 8 }} />
      <Skeleton height={44} style={{ marginBottom: 16 }} borderRadius={UI.radius.md} />

      <Skeleton height={20} width="30%" style={{ marginBottom: 8 }} />
      <Skeleton height={44} style={{ marginBottom: 16 }} borderRadius={UI.radius.md} />

      <Skeleton height={44} style={{ marginBottom: 12 }} borderRadius={UI.radius.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: UI.colors.borderSoft,
  },
  card: {
    padding: 16,
    backgroundColor: UI.colors.card,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: UI.colors.borderSoft,
  },
  form: {
    gap: 16,
    paddingHorizontal: 16,
  },
});
