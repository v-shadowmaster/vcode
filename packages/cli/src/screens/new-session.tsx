import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Header } from '../components/header';
import { InputBar } from '../components/input-bar';
import { TextAttributes } from '@opentui/core';
import { useTheme } from '../providers/theme';

export function NewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors } = useTheme();

  const state = location.state as { message?: string } | null;

  useEffect(() => {
    if (!state?.message) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.message) return null;

  return (
    <box
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
      gap={2}
      position="relative"
      width="100%"
      height="100%"
    >
      <text>creating session............</text>
      <text>{state.message}</text>
    </box>
  );
}
