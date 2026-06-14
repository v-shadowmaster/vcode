import { useTheme } from '../../providers/theme';

type Props = {
  content: string;
  model: string;
};

export function BotMessage({ content, model }: Props) {
  const { colors } = useTheme();

  return (
    <box width="100%" alignItems="center">
      <box paddingY={1} width="100%">
        <box paddingX={3} width="100%">
          <text>{content}</text>
        </box>
        <box paddingY={1} width="100%">
          {model}
        </box>
      </box>
    </box>
  );
}
