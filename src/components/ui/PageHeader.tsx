
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        {icon && <div className="text-primary">{icon}</div>}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
