import Image from "next/image";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col md:flex-row justify-center">
      <div className="md:max-h-full md:flex lg:flex-1 xl:flex-[1.5] 2xl:flex-2">
        <div className="w-full h-6 bg-linear-to-r from-[#90AB82] to-[#487431] rounded-b-full md:hidden" />

        <Image
          src="/assets/banner.png"
          alt="Banner veracis"
          width={1920}
          height={1080}
          className="md:w-full md:h-full md:object-cover md:block hidden"
          priority
          unoptimized
        />
      </div>

      <div className="flex flex-col justify-between flex-1 w-full md:min-w-120 md:max-w-lg overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="w-full flex flex-col items-center mt-8 sm:mt-15 mb-6 sm:mb-10 px-4 sm:px-0">
          <Image
            src="/auth/veracis-impression.svg"
            alt="logo veracis"
            width={380}
            height={80}
            className="w-full `max-w-62.5 sm:max-w-95 h-auto object-contain"
            quality={100}
          />
        </div>

        {children}

        <div className="w-full flex flex-wrap justify-between items-center p-4 sm:p-6 gap-3">
          <span className="hover:cursor-pointer text-xs text-primary font-semibold underline decoration-solid underline-offset-auto lining-nums proportional-nums text-center">
            Política de privacidade
          </span>
          <span className="hover:cursor-pointer text-xs text-primary font-semibold underline decoration-solid underline-offset-auto lining-nums proportional-nums text-center">
            Precisa de ajuda?
          </span>
        </div>
      </div>
    </div>
  );
}
