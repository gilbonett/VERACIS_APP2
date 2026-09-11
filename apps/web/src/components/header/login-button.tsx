"use client";

import Image from "next/image";
import { Button } from "../button";

type LoginButtonProps = {
  onLogin: () => void;
};

export function LoginButton({ onLogin }: LoginButtonProps) {
  return (
    <Button onClick={onLogin}>
      <Image
        src="/header/avatar.png"
        alt="Avatar"
        width={16}
        height={16}
        quality={100}
      />
      Login
    </Button>
  );
}
