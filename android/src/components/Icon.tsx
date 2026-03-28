import React from 'react';
import { View, ViewProps } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { UI } from '../theme/ui';

type IconLibrary = 'ionicons' | 'material' | 'fontawesome';
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps extends ViewProps {
  name: string;
  library?: IconLibrary;
  size?: IconSize;
  color?: string;
}

const getSizeValue = (size: IconSize): number => {
  switch (size) {
    case 'xs':
      return 16;
    case 'sm':
      return 20;
    case 'md':
      return 24;
    case 'lg':
      return 32;
    case 'xl':
      return 48;
    default:
      return 24;
  }
};

export function Icon({
  name,
  library = 'ionicons',
  size = 'md',
  color = UI.colors.textPrimary,
  style,
  ...props
}: IconProps) {
  const sizeValue = getSizeValue(size);

  const renderIcon = () => {
    switch (library) {
      case 'material':
        return (
          <MaterialCommunityIcons name={name as any} size={sizeValue} color={color} />
        );
      case 'fontawesome':
        return (
          <FontAwesome5 name={name as any} size={sizeValue} color={color} />
        );
      default:
        return (
          <Ionicons name={name as any} size={sizeValue} color={color} />
        );
    }
  };

  return (
    <View style={style} {...props}>
      {renderIcon()}
    </View>
  );
}

// Common icon presets
export const Icons = {
  // Navigation
  home: 'home',
  back: 'arrow-back',
  close: 'close',
  menu: 'menu',

  // Actions
  add: 'add',
  edit: 'pencil',
  delete: 'trash',
  search: 'search',
  filter: 'filter',
  settings: 'settings',
  refresh: 'refresh',

  // Status
  check: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',

  // Common
  user: 'person',
  users: 'people',
  lock: 'lock-closed',
  unlock: 'lock-open',
  eye: 'eye',
  eyeOff: 'eye-off',
  calendar: 'calendar',
  clock: 'time',
  phone: 'call',
  email: 'mail',

  // Business
  products: 'basket-outline',
  sales: 'trending-up',
  inventory: 'layers-outline',
  analytics: 'analytics',
} as const;
