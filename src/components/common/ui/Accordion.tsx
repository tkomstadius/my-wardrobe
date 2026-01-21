import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import type { ReactNode } from "react";
import styles from "./Accordion.module.css";

interface AccordionRootProps {
  children: ReactNode;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

function AccordionRoot({ children, type = "single", defaultValue }: AccordionRootProps) {
  const baseDefaultValue = type === "multiple" 
    ? (Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [])
    : (Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []);
    
  return (
    <BaseAccordion.Root
      multiple={type === "multiple"}
      defaultValue={baseDefaultValue}
      className={styles.root}
    >
      {children}
    </BaseAccordion.Root>
  );
}

interface AccordionItemProps {
  children: ReactNode;
  value: string;
}

function AccordionItem({ children, value }: AccordionItemProps) {
  return (
    <BaseAccordion.Item value={value} className={styles.item}>
      {children}
    </BaseAccordion.Item>
  );
}

interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className = "" }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Trigger className={`${styles.trigger} ${className}`}>
      {children}
    </BaseAccordion.Trigger>
  );
}

interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

function AccordionContent({ children, className = "" }: AccordionContentProps) {
  return (
    <BaseAccordion.Panel className={`${styles.content} ${className}`}>
      {children}
    </BaseAccordion.Panel>
  );
}

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};
