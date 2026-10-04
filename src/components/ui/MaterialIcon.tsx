import React from "react";

export interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  variant?: "rounded" | "outlined";
  filled?: boolean;
  size?: number | string;
  className?: string;
}

/**
 * Material Design 3 (M3) Official Symbol Icon Component
 * Usage:
 * <MaterialIcon name="verified" filled className="text-emerald-500" />
 * <MaterialIcon name="smart_toy" size={24} className="text-orange-500" />
 */
const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  variant = "rounded",
  filled = false,
  size,
  className = "",
  style,
  ...props
}) => {
  const fontClass = variant === "outlined" ? "material-symbols-outlined" : "material-symbols-rounded";
  const fillClass = filled ? "icon-fill" : "icon-outline";
  const customStyle: React.CSSProperties = {
    ...(size ? { fontSize: typeof size === "number" ? `${size}px` : size } : {}),
    ...style,
  };

  return (
    <span
      className={`${fontClass} ${fillClass} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
};

export default MaterialIcon;
