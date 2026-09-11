"use client";

import { useUser } from "@/contexts/user-context";
import { ButtonNavigate } from "./button-navigate";

export function Footer() {
  const { user } = useUser();

  return (
    user && (
      <footer className="flex h-full max-h-24 w-full items-center justify-center border-t px-14 shadow-[0_-1px_12px_rgba(0,0,0,0.15)] md:hidden">
        <div className="flex w-full max-w-md items-center justify-between">
          <ButtonNavigate
            iconSrc="/categories/1015.svg"
            label="Calendário"
            href="/calendar"
          />

          <ButtonNavigate
            iconSrc="/categories/1014.svg"
            label="Mapa"
            href="/map"
            prominent
          />

          <ButtonNavigate
            iconSrc="/categories/1013.svg"
            label="Dashboard"
            href="/dashboard"
          />
        </div>
      </footer>
    )
  );
}
