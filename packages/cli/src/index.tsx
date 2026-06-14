import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import './geist-text';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RootLayout } from './layouts/root-layout';
import { Home } from './screens/home';

const router = createMemoryRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'sessions/new',
        element: (
          <box>
            <text>sessions</text>
          </box>
        ),
      },
      {
        path: 'sessions/:id',
        element: (
          <box>
            <text>sessions/id</text>
          </box>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
});
createRoot(renderer).render(<App />);
