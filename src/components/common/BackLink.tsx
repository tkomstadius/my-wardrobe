import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Flex, Link as RadixLink, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";

type BackButtonProps = {
  to: string;
};

export function BackLink({ to }: BackButtonProps) {
  return (
    <RadixLink asChild>
      <Link to={to}>
        <Flex gap="2" align="center">
          <ArrowLeftIcon />
          <Text size="2">Back</Text>
        </Flex>
      </Link>
    </RadixLink>
  );
}
