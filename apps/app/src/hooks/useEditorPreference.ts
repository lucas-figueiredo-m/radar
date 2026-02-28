import { useState, useEffect, useCallback } from 'react';
import { ipcRenderer } from '../services';

export type EditorInfo = {
  id: string;
  name: string;
  cli: string;
};

type EditorPreferenceState = {
  editors: EditorInfo[];
  preferredEditor: string | null;
  setPreferredEditor: (id: string) => void;
};

export const useEditorPreference = (
  onSaveError?: (message: string) => void,
): EditorPreferenceState => {
  const [editors, setEditors] = useState<EditorInfo[]>([]);
  const [preferredEditor, setPreferred] = useState<string | null>(null);

  useEffect(() => {
    ipcRenderer
      ?.invoke('radar:get-editor-info')
      .then((info: { editors: EditorInfo[]; preferred: string | null }) => {
        setEditors(info.editors);
        setPreferred(info.preferred);
      })
      .catch((err: unknown) => {
        console.error('[radar] Failed to load editor info:', err);
      });
  }, []);

  const setPreferredEditor = useCallback((id: string) => {
    ipcRenderer
      ?.invoke('radar:set-editor-preference', id)
      .then((info: { editors: EditorInfo[]; preferred: string }) => {
        setEditors(info.editors);
        setPreferred(info.preferred);
      })
      .catch((err: unknown) => {
        console.error('[radar] Failed to save editor preference:', err);
        onSaveError?.('Failed to save editor preference');
      });
  }, [onSaveError]);

  return { editors, preferredEditor, setPreferredEditor };
};
