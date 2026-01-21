import { Flex } from "../ui/Flex";
import { Text } from "../ui/Text";
import { TextField } from "../ui/TextField";

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
      <TextField.Root size="3">
        <TextField.Input
          type="text"
          defaultValue={defaultValue}
          name={name}
          placeholder={placeholder}
          list={suggestions ? `${name}-suggestions` : undefined}
        />
      </TextField.Root>
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
