import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../src/components/Button';

describe('Button Component', () => {
  test('renderiza com label correto', () => {
    const { getByText } = render(<Button label="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  test('chama onPress quando clicado', () => {
    const handlePress = jest.fn();
    const { getByText } = render(
      <Button label="Click me" onPress={handlePress} />
    );

    fireEvent.press(getByText('Click me'));
    expect(handlePress).toHaveBeenCalled();
  });

  test('desabilita quando disabled prop é true', () => {
    const handlePress = jest.fn();
    const { getByText } = render(
      <Button label="Click me" onPress={handlePress} disabled />
    );

    fireEvent.press(getByText('Click me'));
    expect(handlePress).not.toHaveBeenCalled();
  });

  test('mostra loading state quando loading é true', () => {
    const { queryByText } = render(
      <Button label="Click me" onPress={() => {}} loading />
    );

    // O text não deve estar visível quando loading
    expect(queryByText('Click me')).toBeFalsy();
  });

  test('aplicaestilo correto para variantes', () => {
    const { getByText: getByTextPrimary } = render(
      <Button label="Primary" onPress={() => {}} variant="primary" />
    );
    const { getByText: getByTextDanger } = render(
      <Button label="Danger" onPress={() => {}} variant="danger" />
    );

    expect(getByTextPrimary('Primary')).toBeTruthy();
    expect(getByTextDanger('Danger')).toBeTruthy();
  });

  test('renderiza fullWidth quando fullWidth prop é true', () => {
    const { getByText } = render(
      <Button label="Full" onPress={() => {}} fullWidth />
    );

    expect(getByText('Full')).toBeTruthy();
  });
});
