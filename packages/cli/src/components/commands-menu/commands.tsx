import type { Command } from './types';

export const COMMANDS: Command[] = [
  {
    name: 'new',
    description: 'Start a new conversation',
    value: '/new',
    action: (ctx) => {
      ctx.toast.show({ message: 'Starting a new message .....' });
    },
  },
  {
    name: 'agents',
    description: 'Switch agents',
    value: '/agents',
    action: (ctx) => {
      ctx.dialog.open({
        title: 'Select Mode',
        children: <text>Agent Selection Coming Soon ....</text>,
      });
    },
  },
  {
    name: 'models',
    description: 'Select AI model for generation',
    value: '/models',
    action: (ctx) => {
      ctx.toast.show({ message: 'Selecting models .....' });
    },
  },
  {
    name: 'sessions',
    description: 'Browser past sessions',
    value: '/sessions',
    action: (ctx) => {
      ctx.toast.show({ message: 'Loading sessions .....' });
    },
  },
  {
    name: 'theme',
    description: 'Change color theme',
    value: '/theme',
    action: (ctx) => {
      ctx.toast.show({ message: 'Opening theme picker .....' });
    },
  },
  {
    name: 'login',
    description: 'Sign in to your account',
    value: '/login',
    action: (ctx) => {
      ctx.toast.show({ message: 'Opening browser to sing in .....' });
    },
  },
  {
    name: 'logout',
    description: 'Sign out of your account',
    value: '/logout',
    action: (ctx) => {
      ctx.toast.show({ message: 'Signing out of from your account .....' });
    },
  },
  {
    name: 'upgrade',
    description: 'Buy more credits',
    value: '/upgrade',
    action: (ctx) => {
      ctx.toast.show({ message: 'Opening credits checkout .....' });
    },
  },
  {
    name: 'usage',
    description: 'Open billing portal in your browser',
    value: '/usage',
    action: (ctx) => {
      ctx.toast.show({ message: 'Open billing portal in your browser .....' });
    },
  },
  {
    name: 'exit',
    description: 'Quit a application',
    value: '/exit',
    action: (ctx) => {
      ctx.toast.show({ message: 'Quit the application .....' });
      ctx.exit();
    },
  },
];
