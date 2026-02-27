export type DetailRowProps = {
  label: string;
  value: string;
};

export const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex gap-2.5 py-[3px] text-xs">
    <span className="text-text-secondary min-w-[100px] shrink-0">{label}</span>
    <span className="text-text-primary break-all">{value}</span>
  </div>
);
