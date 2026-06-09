import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type RefObject,
} from 'react';
import { useKeyboard, useRenderer } from '@opentui/react';
import { useCommandMenu } from './commands-menu/use-command';
import type { Command } from './commands-menu/types';
import {
  TextAttributes,
  type KeyBinding,
  type TextareaRenderable,
} from '@opentui/core';
import { StatusBar } from './status-bar';
import { EmptyBorder } from './border';
import { CommandMenu } from './commands-menu';
import { useToast } from '../providers/toast';
import { useKeyboardLayer } from '../providers/keyboad-layer';
import { useDialog } from '../providers/dialog';

type Props = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
};

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
  { name: 'return', action: 'submit' },
  { name: 'kpenter', action: 'submit' },
  { name: 'return', shift: true, action: 'newline' },
];

export function InputBar({ onSubmit, disabled = false }: Props) {
  const textareaRef = useRef<TextareaRenderable>(null);
  const onSubmitRef = useRef<() => void>(() => {});
  const renderer = useRenderer();
  const toast = useToast();
  const dialog = useDialog();
  const { isTopLayer, setResponder } = useKeyboardLayer();

  const {
    showCommandMenu,
    commandQuery,
    selectedIndex,
    scrollRef,
    handleContentChange,
    resolveCommand,
    setSelectedIndex,
  } = useCommandMenu();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.onSubmit = () => {
      onSubmitRef.current();
    };
  }, []);

  // Register the base layer responder for ctrl+c dismissal
  useEffect(() => {
    setResponder('base', () => {
      if (disabled) return false;

      const textarea = textareaRef.current;
      if (textarea && textarea.plainText.length > 0) {
        textarea.setText('');
        return true;
      }
      return false;
    });

    return () => setResponder('base', null);
  }, [disabled, setResponder]);

  const handleTextareaContentChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.plainText;

    handleContentChange(textarea.plainText);
  }, [handleContentChange]);

  const handleCommand = useCallback(
    (command: Command | undefined) => {
      const textarea = textareaRef.current;
      if (!textarea || !command) return;

      textarea.setText('');

      if (command.action) {
        command.action({
          exit: () => renderer.destroy(),
          toast,
          dialog,
        });
      } else {
        textarea.insertText(command.value + ' ');
      }
    },
    [renderer, toast, dialog]
  );

  const handleSubmit = useCallback(() => {
    if (disabled) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.plainText.trim();
    if (text.length === 0) return;

    onSubmit(text);
    textarea.setText('');
  }, [disabled, onSubmit]);

  const handleCommandExecute = useCallback(
    (index: number) => {
      const command = resolveCommand(index);
      handleCommand(command);
    },
    [resolveCommand, handleCommand]
  );

  onSubmitRef.current = () => {
    if (disabled) return;

    if (showCommandMenu) {
      const command = resolveCommand(selectedIndex);
      handleCommand(command);
      return;
    }

    handleSubmit();
  };

  return (
    <box width="100%" flexDirection="column" gap={1}>
      <box
        flexDirection="row"
        alignItems="flex-start"
        width="100%"
        gap={1}
        paddingLeft={1}
        paddingRight={2}
        paddingY={1}
        backgroundColor="#0c0c0c"
        border={['left']}
        borderColor="#b5ec9d"
        customBorderChars={{
          ...EmptyBorder,
          vertical: '┃',
          bottomLeft: '╹',
        }}
      >
        {showCommandMenu && (
          <box
            position="absolute"
            bottom="100%"
            left={0}
            width="100%"
            backgroundColor="#0c0c0c"
            zIndex={10}
          >
            <CommandMenu
              query={commandQuery}
              selectedIndex={selectedIndex}
              scrollRef={scrollRef}
              onSelect={setSelectedIndex}
              onExecute={handleCommandExecute}
            />
          </box>
        )}
        <textarea
          ref={textareaRef}
          flexGrow={1}
          focused={
            !disabled &&
            (isTopLayer('base') ||
              isTopLayer('command') ||
              isTopLayer('mention'))
          }
          placeholder={`Ask anything... Let's build the next big thing`}
          keyBindings={TEXTAREA_KEY_BINDINGS}
          onSubmit={handleSubmit}
          onContentChange={handleTextareaContentChange}
        />
      </box>

      {/* Footer — key hints on the left, mode / model on the right */}
      <box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <StatusBar />
      </box>
    </box>
  );
}
