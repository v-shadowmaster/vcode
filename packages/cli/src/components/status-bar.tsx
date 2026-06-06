import { TextAttributes } from '@opentui/core';

export function StatusBar() {
  return (
    <box flexDirection="row" gap={1}>
      <text fg="#b5ec9d">Build</text>
      <text attributes={TextAttributes.DIM} fg="gray">
        &#8250;
      </text>
      <text>opus-4.8</text>
    </box>
  );
}
