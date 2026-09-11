"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/card";
import { Checkbox } from "@/components/checkbox";
import { Label } from "@/components/label";
import {
  emitLocationSharingChanged,
  getStoredLocationSharingEnabled,
  setStoredLocationSharingDisabled,
  setStoredLocationSharingEnabled,
  setStoredLocationSharingUserId,
  setStoredSharedLocation,
} from "@/lib/location-sharing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { useUser } from "@/contexts/user-context";
import { GetCommunitiesResponse } from "@/http/get-communities";
import { MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProfileLocationCardProps = {
  communities: GetCommunitiesResponse[];
};

export function ProfileLocationCard({ communities }: ProfileLocationCardProps) {
  const { user } = useUser();
  const [shareLocation, setShareLocation] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const communitiesFormatted = useMemo(() => {
    return communities.map((community) => ({
      value: community.id,
      label: community.name,
    }));
  }, [communities]);

  const communityDefault = useMemo(() => {
    return user?.communities[0].communityId;
  }, [user]);

  useEffect(() => {
    setShareLocation(getStoredLocationSharingEnabled());
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setStoredLocationSharingUserId(user.id);
  }, [user?.id]);

  function handleShareLocation(nextChecked: boolean) {
    if (!nextChecked) {
      setShareLocation(false);
      setStoredLocationSharingEnabled(false);
      setStoredLocationSharingDisabled(true);
      emitLocationSharingChanged();
      return;
    }

    if (!navigator.geolocation) {
      setShareLocation(false);
      setStoredLocationSharingEnabled(false);
      setStoredLocationSharingDisabled(true);
      emitLocationSharingChanged();
      return;
    }

    setIsRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setShareLocation(true);
        setStoredLocationSharingEnabled(true);
        setStoredLocationSharingDisabled(false);
        setStoredSharedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          updatedAt: Date.now(),
        });
        emitLocationSharingChanged();
        setIsRequestingLocation(false);
      },
      () => {
        setShareLocation(false);
        setStoredLocationSharingEnabled(false);
        setStoredLocationSharingDisabled(true);
        emitLocationSharingChanged();
        setIsRequestingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  return (
    <Card className="w-full shadow-lg border-0">
      <CardHeader>
        <CardDescription className="text-sm font-bold">
          Dados de Localização
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 ">
        <div className="flex gap-3 items-center">
          <MapPinned className="size-4.25 text-primary mt-2" />
          <div className="flex flex-col">
            <span className="text-primary text-[10px] font-light">Bioma</span>
            <span className="text-zinc-700 text-sm">
              {user?.communities[0].biomeName}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Comunidade</Label>
          <Select
            items={communitiesFormatted}
            defaultValue={communityDefault}
            disabled
          >
            <SelectTrigger className="w-full h-10 border-zinc-800" disabled>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {communitiesFormatted.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="location"
            className="border-zinc-800"
            checked={shareLocation}
            disabled={isRequestingLocation}
            onCheckedChange={(checked) => handleShareLocation(checked === true)}
          />
          <Label htmlFor="location">Compartilhar Localização</Label>
        </div>
      </CardContent>
    </Card>
  );
}
