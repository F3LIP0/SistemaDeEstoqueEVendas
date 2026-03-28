import '@testing-library/jest-native/extend-expect';

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
}));

// Suprimir warnings de console em testes
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
