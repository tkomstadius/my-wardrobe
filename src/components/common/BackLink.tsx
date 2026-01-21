import { IoArrowBackOutline } from "react-icons/io5";
import { Flex } from "./ui/Flex";
import { Link } from "./ui/Link";
import { Text } from "./ui/Text";

type BackButtonProps = {
  to: string;
};

export function BackLink({ to }: BackButtonProps) {
  return (
    <Link to={to}>
      <Flex gap="2" align="center">
        <IoArrowBackOutline />
        <Text size="2">Back</Text>
      </Flex>
    </Link>
  );
}
