"use client";

import { registerUserAction } from "@/actions/register-user-action";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import {
  Input,
  InputControl,
  InputIcon,
  InputPassword,
  InputToggle,
} from "@/components/input";
import { Label } from "@/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Spinner } from "@/components/spinner";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/components/stepper";
import { toastManager } from "@/components/toast";
import { formatCPF, formatDate, formatPhone } from "@/helpers/format";
import { useDebounce } from "@/hooks/use-debounce";
import { GetBiomesResponse } from "@/http/get-biomes";
import { GetCommunitiesResponse } from "@/http/get-communities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { CircleCheck, CircleX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import z from "zod";
import { ActiveLocationBrowserDialog } from "./active-location-browser-dialog";
import { registerSchema } from "./register-schema";
import { SuccessRegisterForm } from "./success-register-dialog";

const STEPS = [1, 2, 3, 4];

const STEPS_FIELDS = {
  1: ["name", "cpf", "birthDate", "terms"] as const,
  2: ["communityId", "role"] as const,
  3: ["phone", "email"] as const,
  4: ["password", "confirmPassword"] as const,
};

type RegisterFormProps = {
  biomes: GetBiomesResponse[];
  communities: GetCommunitiesResponse[];
};

export function RegisterForm({ biomes, communities }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lastedLat = searchParams.get("utm_lat");
  const lastedLng = searchParams.get("utm_lng");

  const {
    form,
    handleSubmitWithAction,
    resetFormAndAction,
    action: { isPending, hasSucceeded },
  } = useHookFormAction(registerUserAction, zodResolver(registerSchema), {
    formProps: {
      mode: "onTouched",
      defaultValues: {
        lastedLat: Number(lastedLat) ?? 0,
        lastedLng: Number(lastedLng) ?? 0,
        name: "",
        cpf: "",
        birthDate: "",
        communityId: "",
        phone: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      },
    },
    actionProps: {
      onSuccess: () => {
        setIsSuccessDialogOpen(true);
      },
      onError({ error }) {
        toastManager.add({
          description: error.serverError,
          title: "Error!",
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

  const [selectedBiomeId, setSelectedBiomeId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  const password = form.watch("password") || "";

  const passwordValidations = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasUpperAndLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumberAndSymbol:
        /\d/.test(password) &&
        /[!@#%$&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    }),
    [password],
  );

  async function handleNextStep() {
    const fields = STEPS_FIELDS[currentStep as keyof typeof STEPS_FIELDS];
    const isValid = await form.trigger(fields);

    if (isValid) {
      setDirection("forward");
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePreviousStep() {
    setCurrentStep((prev) => prev - 1);
    setDirection("backward");
  }

  async function handleCurrentValidadeField(
    fieldName: keyof z.infer<typeof registerSchema>,
  ) {
    await form.trigger(fieldName);
  }

  const debouncedCurrentValidateField = useDebounce(
    handleCurrentValidadeField,
    300,
  );

  function handleOnCloseSuccessDialog() {
    router.push("/auth/signin");
    form.reset();
    setIsSuccessDialogOpen(false);
    setCurrentStep(1);
  }

  const listBiomes = biomes.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const listCommunities = communities.map((item) => ({
    value: item.id,
    label: item.name,
    biomeId: item.biomeId,
  }));

  const filteredCommunities = useMemo(() => {
    return selectedBiomeId
      ? listCommunities.filter(
          (community) => community.biomeId === selectedBiomeId,
        )
      : listCommunities;
  }, [selectedBiomeId]);

  const listRole = [
    { value: "MEMBER", label: "Membro Comunitário" },
    { value: "LEADER", label: "Líder Comunitário" },
  ];

  return (
    <Form {...form}>
      <div className="w-full h-full space-y-8">
        {isSuccessDialogOpen && (
          <SuccessRegisterForm
            isOpen={isSuccessDialogOpen}
            onRedirect={handleOnCloseSuccessDialog}
          />
        )}
        <Stepper
          onValueChange={setCurrentStep}
          value={currentStep}
          className="w-20"
        >
          {STEPS.map((step) => (
            <StepperItem className="not-last:flex-1" key={step} step={step}>
              <StepperTrigger asChild>
                <StepperIndicator />
              </StepperTrigger>
              {step < STEPS.length && <StepperSeparator />}
            </StepperItem>
          ))}
        </Stepper>

        <form
          id="register-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitWithAction(e);
          }}
          className="min-h-56 md:min-h-64 lg:min-h-72 "
        >
          <div
            key={currentStep}
            className={`
              animate-in fade-in duration-500
              ${direction === "forward" ? "slide-in-from-right" : "slide-in-from-left"}
            `}
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputControl
                            placeholder="Digite seu nome completo"
                            {...field}
                            onChange={(e) => {
                              debouncedCurrentValidateField("name");
                              field.onChange(e);
                            }}
                          />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputControl
                            placeholder="Digite seu CPF"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCPF(e.target.value);
                              field.onChange(formatted);
                              debouncedCurrentValidateField("cpf");
                            }}
                          />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de nascimento*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputControl
                            placeholder="Digite sua data de nascimento"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatDate(e.target.value);
                              field.onChange(formatted);
                              debouncedCurrentValidateField("birthDate");
                            }}
                          />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2 items-center">
                        <FormControl>
                          <Checkbox
                            id="terms-label"
                            className="border-zinc-400"
                            checked={field.value}
                            disabled={field.disabled}
                            name={field.name}
                            onCheckedChange={(e) => {
                              field.onChange(e);
                              debouncedCurrentValidateField("terms");
                            }}
                          />
                        </FormControl>
                        <FormLabel htmlFor="terms-label">
                          Aceitar Termos e Condições
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="w-full space-y-6">
                <div>
                  <Label className="mb-2">Biomas*</Label>
                  <Select
                    items={listBiomes}
                    value={selectedBiomeId}
                    onValueChange={(value) => setSelectedBiomeId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        className="h-12"
                        placeholder="Selecione um bioma"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {listBiomes.map((biome) => (
                        <SelectItem key={biome.value} value={biome.value}>
                          {biome.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="communityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comunidades*</FormLabel>
                      <FormControl>
                        <Select
                          items={listCommunities}
                          value={field.value}
                          onValueChange={(e) => {
                            field.onChange(e);
                            debouncedCurrentValidateField("communityId");
                          }}
                          disabled={!selectedBiomeId}
                        >
                          <SelectTrigger className="w-full h-10 border-zinc-400">
                            <SelectValue placeholder="Selecione uma comunidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCommunities.map((community) => (
                              <SelectItem
                                key={community.value}
                                value={community.value}
                              >
                                {community.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil*</FormLabel>
                      <FormControl>
                        <Select
                          items={listRole}
                          value={field.value}
                          onValueChange={(e) => {
                            field.onChange(e);
                            debouncedCurrentValidateField("role");
                          }}
                          disabled={!selectedBiomeId}
                        >
                          <SelectTrigger className="w-full border-zinc-400">
                            <SelectValue placeholder="Selecione uma comunidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {listRole.map((item) => (
                              <SelectItem value={item.value} key={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ActiveLocationBrowserDialog />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputControl
                            placeholder="Digite seu telefone"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              debouncedCurrentValidateField("phone");
                              field.onChange(formatted);
                            }}
                          />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputControl
                            placeholder="Digite seu email"
                            {...field}
                            onChange={(e) => {
                              debouncedCurrentValidateField("email");
                              field.onChange(e);
                            }}
                          />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/*<FormField
                  control={form.control}
                  name="emailRecovery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> E-mail de recuperação (Opcional)</FormLabel>
                      <FormControl>
                        <Input>
                          <InputControl
                            placeholder="Digite seu email de recuperação"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedCurrentValidateField("emailRecovery");
                            }}
                          />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />*/}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputIcon name="lock" />
                          <InputPassword
                            placeholder="Digite sua senha"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedCurrentValidateField("password");
                            }}
                          />
                          <InputToggle />
                        </Input>
                      </FormControl>
                      <div>
                        <span className="text-blue-900 font-semibold text-sm">
                          Sua senha deve conter:
                        </span>

                        <FormDescription
                          className={`flex items-center gap-2 text-xs my-1 font-semibold ${
                            passwordValidations.minLength
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          {passwordValidations.minLength ? (
                            <CircleCheck className="size-4" />
                          ) : (
                            <CircleX className="size-4" />
                          )}
                          No mínimo 8 caracteres
                        </FormDescription>

                        <FormDescription
                          className={`flex items-center gap-2 text-xs my-1 font-semibold ${
                            passwordValidations.hasUpperAndLower
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          {passwordValidations.hasUpperAndLower ? (
                            <CircleCheck className="size-4" />
                          ) : (
                            <CircleX className="size-4" />
                          )}
                          Letras maiúsculas e minúsculas
                        </FormDescription>

                        <FormDescription
                          className={`flex items-center gap-2 text-xs my-1 font-semibold ${
                            passwordValidations.hasNumberAndSymbol
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          {passwordValidations.hasNumberAndSymbol ? (
                            <CircleCheck className="size-4" />
                          ) : (
                            <CircleX className="size-4" />
                          )}
                          Números e símbolos ( Ex: !@#%$)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha*</FormLabel>
                      <FormControl>
                        <Input>
                          <InputIcon name="lock" />
                          <InputPassword
                            placeholder="Digite sua confirmação de senha"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              debouncedCurrentValidateField("confirmPassword");
                            }}
                          />
                          <InputToggle />
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </form>

        <div className="w-full h-10 flex justify-end gap-2">
          <Button
            type="button"
            // className="w-32 font-sansw-32 border-blue-950 rounded-full text-blue-950 hover:bg-blue-50 hover:cursor-pointer"
            disabled={currentStep === 1}
            onClick={handlePreviousStep}
            variant="outline"
          >
            Voltar
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              // className="font-sans w-32 rounded-full hover:cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNextStep();
              }}
            >
              Avançar
            </Button>
          ) : (
            <Button
              form="register-form"
              type="submit"
              disabled={isPending}
              // className="font-sans w-32 rounded-full hover:cursor-pointer"
            >
              {isPending ? <Spinner /> : "Cadastrar"}
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}
