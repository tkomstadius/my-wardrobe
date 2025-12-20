import { Flex, Select, Text } from "@radix-ui/themes";

type SelectInputProps = {
  label: string;
  name: string;
  options: { id: string; title: string }[];
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string;
};

export function SelectInput({
  label,
  name,
  options,
  onValueChange,
  disabled = false,
  defaultValue,
}: SelectInputProps) {
  return (
    <Flex direction="column" gap="1">
      <Text as="label" size="2" weight="bold">
        {label}
      </Text>
      <Select.Root
        name={name}
        size="3"
        onValueChange={onValueChange}
        disabled={disabled}
        defaultValue={defaultValue}
      >
        <Select.Trigger placeholder="Select an option" variant="soft" />
        <Select.Content>
          {options.map(({ title, id }) => (
            <Select.Item key={id} value={id}>
              {title}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
