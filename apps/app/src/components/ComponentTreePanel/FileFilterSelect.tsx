import { ChevronDown } from 'lucide-react';
import { shortenPath } from '../../utils';

export type FileFilterSelectProps = {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
};

export const FileFilterSelect = ({
  files,
  selectedFile,
  onSelectFile,
}: FileFilterSelectProps) => (
  <div className="relative">
    <select
      value={selectedFile ?? ''}
      onChange={e => onSelectFile(e.target.value || null)}
      className="appearance-none bg-bg-surface text-text-primary text-xs pl-2 pr-6 py-1 rounded border border-border-subtle cursor-pointer hover:border-border-default focus:outline-none focus:border-accent"
    >
      <option value="">All files</option>
      {files.map(file => (
        <option key={file} value={file}>
          {shortenPath(file)}
        </option>
      ))}
    </select>
    <ChevronDown
      size={12}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary"
    />
  </div>
);
