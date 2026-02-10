import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  subtitle?: string;
}

export function PageHeader({ title, actions, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 pb-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
