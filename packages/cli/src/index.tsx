import { Box, createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import './geist-text';
import { Header } from './components/header';
import { StatusBar } from './components/status-bar';

function App() {
  return (
    <box
      alignItems="center"
      justifyContent="center"
      backgroundColor="#0a0a0a"
      width="100%"
      height="100%"
      gap={2}
    >
      <Header />
      <StatusBar />
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
