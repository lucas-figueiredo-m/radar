type BinaryIndicatorProps = {
  label: string;
};

export const BinaryIndicator = ({ label }: BinaryIndicatorProps) => (
  <span className="text-xs text-text-tertiary italic">{label}</span>
);
