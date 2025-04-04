
import React from "react";

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className = "", id }: ContainerProps) {
  return (
    <div id={id} className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
