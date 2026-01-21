import { Checkbox } from "./ui/Checkbox";
import { Flex } from "./ui/Flex";
import { Text } from "./ui/Text";

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
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
        />
        {label}
      </Flex>
    </Text>
  );
}
