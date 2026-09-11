'use client'

import { logoutUserAction } from '@/actions/logout-user-action'
import { useUser } from '@/contexts/user-context'
import { getPrimaryCommunity } from '@/utils/user-community'
import { USER_ROLE_LABELS } from '@/utils/user-roles'
import { firstTwoInitials } from '@/utils/get-first-two-initials'
import {
  ChevronDown,
  ChevronUp,
  CircleQuestionMark,
  Lock,
  LogOut,
  User,
  UserLock,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../avatar'
import { Badge } from '../badge'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Separator } from '../separator'
import { Spinner } from '../spinner'
import { LoginButton } from './login-button'

function tokenize(fullName: string): string[] {
  return fullName?.trim().split(/\s+/).filter(Boolean)
}

export function firstName(fullName: string): string {
  const parts = tokenize(fullName)
  return parts[0] ?? ''
}

export function AvatarPopover() {
  const { user } = useUser()
  const primaryCommunity = getPrimaryCommunity(user)
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { execute, isPending } = useAction(logoutUserAction)

  function handleNavigate(path: string = '/') {
    router.push(path)
    setIsOpen(false)
  }

  return !user ? (
    <LoginButton onLogin={() => router.push('/auth/signin')} />
  ) : (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="sm:min-w-30 sm:h-12 rounded-md px-2 hover:bg-primary/5"
        render={
          <button
            type="button"
            className="sm:min-w-30 sm:h-12 rounded-md px-2 hover:bg-primary/5"
          >
            <div className="flex items-center gap-4">
              <Avatar className="size-10">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback>{firstTwoInitials(user.name)}</AvatarFallback>
              </Avatar>

              <span className="hidden md:inline-flex">
                Olá, <strong className="ml-1">{firstName(user.name)}</strong>
              </span>

              {isOpen ? (
                <ChevronUp
                  size={16}
                  strokeWidth={3}
                  className="text-primary hidden md:block"
                />
              ) : (
                <ChevronDown
                  size={16}
                  strokeWidth={3}
                  className="text-primary hidden md:block"
                />
              )}
            </div>
          </button>
        }
      />
      <PopoverContent align="start" className="min-w-84.75 mr-10 px-0">
        <div className="flex flex-col gap-2">
          <div className="w-full flex flex-col gap-2 items-center px-4">
            <Badge
              variant="secondary"
              className="text-[#90AB82] bg-[#90AB82]/20 self-end"
            >
              {USER_ROLE_LABELS[user.role]}
            </Badge>

            <div className="size-24.75 border-4 border-[#91AC83] rounded-full flex justify-center items-center">
              <Avatar className="size-20.75">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback>{firstTwoInitials(user.name)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="mt-2 flex flex-col">
              <h2 className="text-center text-xl">
                Olá, <strong>{user.name}</strong>
              </h2>
              {primaryCommunity?.communityName ? (
                <span className="text-center text-sm text-[#90AB82]">
                  {primaryCommunity.communityName}
                </span>
              ) : null}
            </div>

            {/*<div className="w-full p-2 space-y-2 bg-zinc-50 rounded-lg">
              <strong className="text-xs">Contribuições</strong>
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#90AB82] text-xl">120</span>
                <span className="text-[#90AB82] text-xs">
                  Participante <strong>Ativa</strong>
                </span>
              </div>
              <Progress value={40} />
            </div>*/}

            {/*<div className="w-full flex justify-between">
              <span className="font-light text-sm">Minha Conta</span>
              <span className="text-primary font-semibold text-sm flex gap-2 items-center">
                Mudar Perfil <CircleQuestionMark className="size-5" />
              </span>
            </div>*/}
          </div>

          <Separator />

          <div className="flex w-full flex-col">
            <button
              type="button"
              className="w-full px-4 flex items-center gap-2 h-10 hover:bg-primary/5"
              onClick={() => handleNavigate('/profile')}
            >
              <User className="size-3 text-primary" />
              <span className="font-light text-sm text-primary">
                Dados Pessoais
              </span>
            </button>

            <button
              type="button"
              className="w-full px-4 flex items-center gap-2 h-10 hover:bg-primary/5"
            >
              <Lock className="size-3 text-primary" />
              <span className="font-light text-sm text-primary">
                Segurança da Conta
              </span>
            </button>

            <button
              type="button"
              className="w-full px-4 flex items-center gap-2 h-10 hover:bg-primary/5"
            >
              <UserLock className="size-3 text-primary" />
              <span className="font-light text-sm text-primary">
                Privacidade e LGPD
              </span>
            </button>

            <button
              type="button"
              className="w-full px-4 flex items-center gap-2 h-10 hover:bg-primary/5"
            >
              <CircleQuestionMark className="size-3 text-primary" />
              <span className="font-light text-sm text-primary">Ajuda</span>
            </button>

            <button
              type="button"
              disabled={isPending}
              className="w-full px-4 flex items-center gap-2 h-10 hover:bg-primary/5 disabled:opacity-70"
              onClick={() => execute()}
            >
              <LogOut className="size-3 text-primary" />
              <span className="font-light text-sm text-primary flex gap-2">
                {isPending ? (
                  <>
                    <Spinner /> Carregando...
                  </>
                ) : (
                  'Sair'
                )}
              </span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
