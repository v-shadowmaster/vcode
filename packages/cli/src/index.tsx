import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import './geist-text';

function App() {
  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <box justifyContent="center" alignItems="flex-end">
        {/* variant="solid" = pure font look, variant="ascii" = ascii-art shading */}
        <geist-text text="VINAY KUMAR" color="gray" rows={4} variant="solid" />
        <textarea focused />
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
