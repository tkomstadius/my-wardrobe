import { Flex, TextField, Text } from "@radix-ui/themes";

type TextInputProps = {
  label: string;
  name: string;
  placeholder: string;
  suggestions?: string[];
  defaultValue?: string;
};

export function TextInput({
  label,
  name,
  placeholder,
  suggestions,
  defaultValue,
}: TextInputProps) {
  return (
    <Flex direction="column" gap="1">
      <Text as="label" size="2" weight="bold">
        {label}
      </Text>
      <TextField.Root
        type="text"
        defaultValue={defaultValue}
        variant="soft"
        name={name}
        size="3"
        placeholder={placeholder}
        list={suggestions ? `${name}-suggestions` : undefined}
      />
      {suggestions && (
        <datalist id={`${name}-suggestions`}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
    </Flex>
  );
}
