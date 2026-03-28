import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  View as RNView,
} from 'react-native';
import { UI } from '../theme/ui';
import { Button } from './Button';

interface ModalDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'danger' | 'success';
  loading?: boolean;
  children?: React.ReactNode;
}

export function ModalDialog({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'info',
  loading = false,
  children,
}: ModalDialogProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'danger':
        return UI.colors.danger;
      case 'warning':
        return UI.colors.warning;
      case 'success':
        return UI.colors.success;
      default:
        return UI.colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: getTypeColor() }]}>
            <View
              style={[styles.indicator, { backgroundColor: getTypeColor() }]}
            />
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.content}>
            {message && <Text style={styles.message}>{message}</Text>}
            {children}
          </View>

          <View style={styles.footer}>
            <Button
              label={cancelText}
              variant="ghost"
              size="md"
              onPress={onCancel}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <Button
              label={confirmText}
              variant={type === 'danger' ? 'danger' : 'primary'}
              size="md"
              loading={loading}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: UI.colors.card,
    borderRadius: UI.radius.lg,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
  },
  indicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: UI.colors.textPrimary,
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  message: {
    fontSize: 14,
    color: UI.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: UI.colors.borderSoft,
  },
});
