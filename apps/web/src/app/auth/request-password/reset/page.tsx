import { validatePasswordReset } from "@/http/mutations/validate-password-reset";
import { redirect } from "next/navigation";
import { ResetForm } from "./reset-form";

const DAFAULT_DIRECT_PATH = "/auth/signin";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect(DAFAULT_DIRECT_PATH);
  }

  const isValidateToken = await validatePasswordReset({ token });

  console.log(isValidateToken);

  if (!isValidateToken.valid) {
    redirect(DAFAULT_DIRECT_PATH);
  }

  return (
    <div className="w-full flex flex-1 flex-col space-y-4 px-6">
      <strong className="text-base font-bold">Criar nova senha</strong>

      <ResetForm token={token} />
    </div>
  );
}
