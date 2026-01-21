import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

interface TabsRootProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function TabsRoot({ children, defaultValue, value, onValueChange }: TabsRootProps) {
  return (
    <BaseTabs.Root 
      defaultValue={defaultValue} 
      value={value}
      onValueChange={onValueChange}
      className={styles.root}
    >
      {children}
    </BaseTabs.Root>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return <BaseTabs.List className={`${styles.list} ${className || ""}`}>{children}</BaseTabs.List>;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  return (
    <BaseTabs.Tab value={value} className={`${styles.trigger} ${className || ""}`}>
      {children}
    </BaseTabs.Tab>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
  return (
    <BaseTabs.Panel value={value} className={`${styles.content} ${className || ""}`}>
      {children}
    </BaseTabs.Panel>
  );
}

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
