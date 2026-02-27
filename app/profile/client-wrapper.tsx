"use client";

import { useSession } from "@/components/providers/session-provider";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileSettings } from "@/components/profile/profile-settings";

interface ProfileClientProps {
  stats: {
    completedHarvests: number;
    totalSaved: number;
  };
}

export function ProfileClient({ stats }: ProfileClientProps) {
  const session = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 md:px-6 space-y-6 pt-20 pb-24 md:pb-8 mt-6">
      <ProfileHeader user={session.user} />
      <ProfileStats
        completedHarvests={stats.completedHarvests}
        totalSaved={stats.totalSaved}
        createdAt={session.user.createdAt}
      />
      <ProfileSettings user={session.user} />
    </div>
  );
}
