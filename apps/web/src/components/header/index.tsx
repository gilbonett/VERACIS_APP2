import { TextAlignJustify } from "lucide-react";
import { AvatarPopover } from "./avatar-propover";
import { InputSearch } from "./input-search";
import { Navlink } from "./nav-link";
import { Notification } from "./notification";

export function Header() {
  return (
    <header className="w-full h-24 md:h-32 lg:h-44 border-b flex items-center py-4 justify-between px-4 md:px-6 lg:px8 shadow">
      <div className="flex items-center gap-4">
        {/*<TextAlignJustify className="text-green-600" />*/}
        <div>
          <div className="space-x-2">
            <span className="text-[#90AB82] hidden md:inline-flex text-2xl md:text-3xl lg:text-4xl">
              Plataforma
            </span>
            <strong className="bg-linear-to-r from-[#90AB82] to-[#1D5401] bg-clip-text text-transparent text-3xl font-extrabold md:text-3xl lg:text-4xl">
              VERACIS
            </strong>
          </div>
          <div className="bg-linear-to-r from-white to-[#EBF0E8] text-[#7B8C73] rounded-full hidden md:inline-flex md:text-xs lg:text-sm pr-2">
            Vulnerabilidades Étnico-Raciais, Ambiente, Clima e Impacto na Saúde
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-evenly items-end h-full gap-2">
        <div className="flex items-center gap-5">
          <Navlink />

          <Notification />

          {/*<LoginButton onLogin={handleLogin} />*/}

          <AvatarPopover />
        </div>

        <InputSearch />
      </div>
    </header>
  );
}
