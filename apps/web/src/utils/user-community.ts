type UserWithCommunities = {
  communities: Array<{
    communityId: string
    communityName: string
    biomeName: string
  }>
}

export function getPrimaryCommunity(user: UserWithCommunities | null | undefined) {
  return user?.communities?.[0]
}
