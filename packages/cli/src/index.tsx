import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import './geist-text';
import { Header } from './components/header';
import { InputBar } from './components/input-bar';
import { ToastProvider } from './providers/toast';
import { KeyboardLayerProvider } from './providers/keyboad-layer';

function App() {
  return (
    <KeyboardLayerProvider>
      <ToastProvider>
        <box
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          backgroundColor="#0a0a0a"
          width="100%"
          height="100%"
        >
          {/* One shared, centered column so the header and input share the same bounds */}
          <box
            flexDirection="column"
            width="100%"
            maxWidth={78}
            paddingX={2}
            gap={2}
          >
            <Header />
            <InputBar onSubmit={() => {}} />
          </box>
        </box>
      </ToastProvider>
    </KeyboardLayerProvider>
  );
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
});
createRoot(renderer).render(<App />);
