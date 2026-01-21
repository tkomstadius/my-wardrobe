import type { CSSProperties, ReactNode } from "react";

interface FlexProps {
  children: ReactNode;
  direction?: "row" | "column";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  gap?: "1" | "2" | "3" | "4" | "5";
  wrap?: "wrap" | "nowrap";
  style?: CSSProperties;
  className?: string;
  mb?: string;
  mt?: string;
  my?: string;
}

export function Flex({
  children,
  direction = "row",
  align = "stretch",
  justify = "start",
  gap = "2",
  wrap = "nowrap",
  style = {},
  className = "",
  mb,
  mt,
  my,
}: FlexProps) {
  const gapMap = {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.5rem",
  };

  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  };

  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
  };

  const marginStyles: CSSProperties = {};
  if (mb) marginStyles.marginBottom = mb;
  if (mt) marginStyles.marginTop = mt;
  if (my) {
    marginStyles.marginTop = my;
    marginStyles.marginBottom = my;
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: direction,
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        gap: gapMap[gap],
        flexWrap: wrap,
        ...marginStyles,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
