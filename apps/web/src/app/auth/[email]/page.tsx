import { hasCookie } from "@/http/cookies/has-cookie";
import { COOKIE_NAMES } from "@/http/cookies/options";
import { Mail } from "lucide-react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { StepEmailForm } from "./step-email-form";

type PageProps = {
  params: Promise<{ email: string }>;
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { email } = await params;

  return {
    title: `Verifique seu e-mail ${decodeURIComponent(email)}`,
  };
};

export default async function Page({ params }: PageProps) {
  const { email } = await params;

  const hasStepToken = await hasCookie(COOKIE_NAMES.CHAGELLE_TOKEN);

  if (!hasStepToken) redirect("/auth/signin");

  return (
    <div className="w-full flex flex-1 flex-col space-y-4 px-6">
      <div className="space-y-2">
        <h1 className="text-base font-bold">Verifique seu e-mail</h1>

        <div className="text-muted-foreground text-sm">
          <p className="leading-relaxed">
            <Mail size={16} className="inline-block mr-1.5" />
            Enviamos um código de verificação para{" "}
            <strong className="font-semibold text-black wrap-break-word">
              {decodeURIComponent(email)}
            </strong>
            . Digite o código recebido abaixo para verificar seu endereço de
            e-mail.
          </p>
        </div>
      </div>

      <StepEmailForm />
    </div>
  );
}
