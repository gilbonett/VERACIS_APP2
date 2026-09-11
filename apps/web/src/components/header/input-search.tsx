import { Search } from 'lucide-react'
// import { Input } from "../ui/input";

export function InputSearch() {
  return (
    <div className="items-center h-12 px-4 gap-2 w-96 bg-slate-100 rounded-sm hidden md:flex">
      <input
        type="text"
        className="w-full h-full text-base border-0 outline-none focus-visible:ring-0 bg-transparent placeholder:italic"
        placeholder="O que você procura?"
      />

      {/*<Input
        className="border-0 focus-visible:ring-0 shadow-transparent bg-transparent placeholder:italic"
        placeholder="O que você procura?"
      />*/}
      <Search className="text-primary" />
    </div>
  )
}
