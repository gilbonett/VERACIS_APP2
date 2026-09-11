import { getBiomes } from '@/http/get-biomes'
import { getCommunities } from '@/http/get-communities'
import { RegisterForm } from './register-form'

export default async function Page() {
  const [biomes, communities] = await Promise.all([
    getBiomes(),
    getCommunities(),
  ])

  return (
    <div className="w-full flex flex-1 flex-col space-y-6 px-6 my-8">
      <strong className="text-base font-bold">Cadastro Básico</strong>

      <RegisterForm biomes={biomes} communities={communities} />
    </div>
  )
}
