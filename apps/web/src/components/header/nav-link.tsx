"use client";

import { useUser } from "@/contexts/user-context";
import Link from "next/link";

function ButtonRedirect({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="text-primary font-semibold text-xs hover:border-primary/20 hover:cursor-pointer"
      href={href}
    >
      {label}
    </Link>
  );
}

export function Navlink() {
  const { user } = useUser();

  return (
    <nav className="mr-4 gap-6 hidden md:flex">
      <ButtonRedirect href="/map" label="Mapa" />

      {user && <ButtonRedirect href="/calendar" label="Calendário" />}

      {user && <ButtonRedirect href="/dashboard" label="Dashboard" />}
    </nav>
  );
}
