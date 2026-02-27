interface StatusBarProps {
  label: string;
}

export const StatusBar = ({ label }: StatusBarProps) => (
  <div className="px-4 py-1.5 border-t border-border-default text-[11px] text-text-tertiary shrink-0 flex justify-between">
    <span>{label}</span>
    <span>ws://localhost:8347</span>
  </div>
);
