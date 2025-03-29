
import React from "react";

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
}
