import { getCommunities } from "@/http/get-communities";
import { AvatarProfile } from "./avatar-profile";
import { ProfileContactCard } from "./profile-contact-card";
import { ProfileLocationCard } from "./profile-location-card";
import { ProfileSocialCard } from "./profile-social-card";

export default async function ProfilePage() {
  const communities = await getCommunities();

  return (
    <div className="w-full flex flex-col items-center gap-6 pb-28 md:pb-6">
      <AvatarProfile />

      <div className="w-full flex flex-col gap-6 lg:h-fit lg:flex-row">
        <ProfileSocialCard />

        <ProfileLocationCard communities={communities} />

        <ProfileContactCard />
      </div>
    </div>
  );
}
