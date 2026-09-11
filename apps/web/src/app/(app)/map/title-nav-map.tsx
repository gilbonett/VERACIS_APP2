'use client'

import { useUser } from '@/contexts/user-context'
import { getPrimaryCommunity } from '@/utils/user-community'

export function TitleNavMap() {
  const { user } = useUser()
  const community = getPrimaryCommunity(user)

  if (!community) return null

  return (
    <span className="text-lg md:text-2xl pb-4">
      <strong>{community.biomeName}</strong> - {community.communityName}
    </span>
  )
}
