import { Checkbox, Flex, Text } from "@radix-ui/themes";

interface CheckboxFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export function CheckboxField({
  checked,
  onCheckedChange,
  label,
}: CheckboxFieldProps) {
  return (
    <Text as="label" size="3">
      <Flex gap="2" align="center">
        <Checkbox
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
        />
        {label}
      </Flex>
    </Text>
  );
}

