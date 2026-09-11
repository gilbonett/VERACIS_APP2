"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/card";
import { Input, InputControl, InputIcon } from "@/components/input";
import { Label } from "@/components/label";
import { useUser } from "@/contexts/user-context";

export function ProfileContactCard() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Card className="w-full shadow-lg border-0">
      <CardHeader>
        <CardDescription className="text-sm font-bold">
          Dados Contato
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Telefone*</Label>
          <Input disabled defaultValue={user.phone ? user.phone : undefined}>
            <InputIcon name="phone" />
            <InputControl
              placeholder="Preencha seu telefone"
              value={user.phone ? user.phone : undefined}
            />
            {/*<InputAction iconName="square-pen" />*/}
          </Input>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Email*</Label>

          <Input disabled defaultValue={user?.email}>
            <InputIcon name="mail" />
            <InputControl
              placeholder="Preencha seu email"
              value={user?.email}
            />
            {/*<InputAction iconName="square-pen" />*/}
          </Input>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Email de Recuperação(Opcional)
          </Label>
          <Input disabled>
            <InputIcon name="mail" />
            <InputControl placeholder="Preencha seu email de recuperação" />
            {/*<InputAction iconName="square-pen" />*/}
          </Input>
        </div>
      </CardContent>
    </Card>
  );
}
