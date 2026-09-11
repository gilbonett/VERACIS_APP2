'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/avatar'
import { useUser } from '@/contexts/user-context'
import { firstTwoInitials } from '@/utils/get-first-two-initials'
import { UpdateImageDialog } from './(dialogs)/update-image-dialog'

export function AvatarProfile() {
  const { user } = useUser()

  return (
    user && (
      <div className="flex flex-col items-center gap-4">
        <div className="size-38 border-6 border-[#91AC83] bg-transparent rounded-full flex justify-center items-center">
          <Avatar className="size-33">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback className="text-xl">
              {firstTwoInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <UpdateImageDialog />
      </div>
    )
  )
}
