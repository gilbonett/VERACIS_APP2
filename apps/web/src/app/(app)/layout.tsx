import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { UserProvider } from "@/contexts/user-context";
import { getProfile } from "@/http/queries/get-profile";
import { DynamicBreadcrumb } from "./dynamic-breadcrumb";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getProfile();

  return (
    <UserProvider user={user}>
      <div
        className="flex flex-col w-screen max-w-screen overflow-hidden"
        style={{ height: "100dvh" }}
      >
        <Header />
        <DynamicBreadcrumb className="px-4 pt-2" />
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-4 py-4">
          {children}
        </div>
        <Footer />
      </div>
    </UserProvider>
  );
}
