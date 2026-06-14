import 'opentui-spinner/react';
import { useTheme } from '../providers/theme';

export function Spinner() {
  const { colors } = useTheme();

  return <spinner name="binary" color={colors.primary} />;
}
