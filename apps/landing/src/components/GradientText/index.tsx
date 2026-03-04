"use client";

import type { ReactNode } from "react";

type GradientTextProps = {
  children: ReactNode;
  className?: string;
};

export const GradientText = ({ children, className = "" }: GradientTextProps) => {
  return (
    <span
      className={`bg-gradient-to-r from-accent via-[#94e2d5] to-accent bg-[length:400%_100%] bg-clip-text text-transparent animate-[shimmer_6s_linear_infinite] ${className}`}
    >
      {children}
    </span>
  );
};
