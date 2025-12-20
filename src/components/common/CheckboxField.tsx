import { Checkbox, Flex, Text } from "@radix-ui/themes";

interface CheckboxFieldProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  defaultChecked?: boolean;
}

export function CheckboxField({
  checked,
  onCheckedChange,
  name,
  defaultChecked,
  label,
}: CheckboxFieldProps) {
  return (
    <Text as="label" size="2" weight="bold">
      <Flex gap="2" align="center">
        <Checkbox
          variant="soft"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={
            onCheckedChange
              ? (checked) => onCheckedChange(checked === true)
              : undefined
          }
        />
        {label}
      </Flex>
    </Text>
  );
}
