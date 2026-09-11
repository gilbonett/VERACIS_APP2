"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/card";
import { useUser } from "@/contexts/user-context";
import { formatCPF } from "@/helpers/format";
import { CalendarDays, CircleUserRound, IdCard } from "lucide-react";

export function ProfileSocialCard() {
  const { user } = useUser();

  return (
    <Card className="w-full shadow-lg border-0">
      <CardHeader>
        <CardDescription className="text-sm font-bold">
          Dados Pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 items-center">
          <CircleUserRound className="size-4.25 text-primary mt-2" />
          <div className="flex flex-col">
            <span className="text-primary text-[10px] font-light">
              Nome Completo
            </span>
            <span className="text-zinc-700 text-sm">{user?.name}</span>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <IdCard className="size-4.25 text-primary mt-2" />
          <div className="flex flex-col">
            <span className="text-primary text-[10px] font-light">CPF</span>
            <span className="text-zinc-700 text-sm">
              {user && formatCPF(user.cpf)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <CalendarDays className="size-4.25 text-primary mt-2" />
          <div className="flex flex-col">
            <span className="text-primary text-[10px] font-light">
              Nascimento
            </span>
            <span className="text-zinc-700 text-sm">{user?.birthDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
