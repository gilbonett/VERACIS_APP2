"use client";

import { signInUserAction } from "@/actions/sign-in-user-action";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/field";
import {
  Input,
  InputControl,
  InputIcon,
  InputPassword,
  InputToggle,
} from "@/components/input";
import { Label } from "@/components/label";
import { Separator } from "@/components/separator";
import { Spinner } from "@/components/spinner";
import { toastManager } from "@/components/toast";
import { formatCPF } from "@/helpers/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import Link from "next/link";
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { loginSchema } from "./login-schema";

export function LoginForm() {
  const {
    form,
    handleSubmitWithAction,
    action: { isPending, hasSucceeded },
    resetFormAndAction,
  } = useHookFormAction(signInUserAction, zodResolver(loginSchema), {
    formProps: {
      defaultValues: {
        cpf: "",
        password: "",
      },
    },
    actionProps: {
      onError({ error }) {
        toastManager.add({
          description: error.serverError,
          title: "Erro!",
          type: "error",
        });
      },
    },
  });

  useEffect(() => {
    if (hasSucceeded) {
      resetFormAndAction();
    }
  }, [hasSucceeded]);

  return (
    <form onSubmit={handleSubmitWithAction} className="space-y-6">
      <FieldGroup>
        <Controller
          name="cpf"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-for-cpf">CPF</FieldLabel>
              <Input>
                <InputIcon name="user" />
                <InputControl
                  id="form-for-cpf"
                  aria-invalid={fieldState.invalid}
                  placeholder="Ex: 999.999.999-99"
                  maxLength={14}
                  {...field}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    field.onChange(formatted);
                  }}
                />
              </Input>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-for-password">Senha</FieldLabel>
              <Input>
                <InputIcon name="lock-keyhole" />
                <InputPassword
                  id="form-for-password"
                  placeholder="••••••••"
                  {...field}
                />
                <InputToggle />
              </Input>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Field orientation="horizontal" className="justify-between">
        <div className="flex items-center gap-2">
          <Checkbox />
          <Label className="text-sm font-bold">Manter-me conectado</Label>
        </div>

        {/*<Link
          href="/auth/request-password"
          className="hover:cursor-pointer text-xs font-semibold text-primary underline"
        >*/}
        <Link
          href="/auth/request-password"
          className="hover:cursor-pointer text-xs text-primary font-semibold underline decoration-solid underline-offset-auto lining-nums proportional-nums"
        >
          Esqueceu sua senha?
        </Link>
      </Field>

      <Field className="space-y-6 items-center">
        <Button size="full" type="submit" disabled={isPending}>
          {isPending ? <Spinner /> : "Entrar"}
        </Button>

        <Separator />

        <Link
          href="/auth/register"
          className="max-w-fit h-10 text-base font-semibold text-primary"
        >
          Cadastre-se
        </Link>
      </Field>
    </form>
  );
}
