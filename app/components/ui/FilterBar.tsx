import { ReactNode } from "react";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export function FilterBar({ children, className = "" }: FilterBarProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 mb-6 ${className}`}>
      {children}
    </div>
  );
}
