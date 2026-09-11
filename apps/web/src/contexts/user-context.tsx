"use client";

import { GetProfileResponse } from "@/http/queries/get-profile";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type UserContextType = {
  user: GetProfileResponse | null;
  patchUser: (patch: Partial<GetProfileResponse>) => void;
};

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function UserProvider({
  children,
  user: initialUser,
}: {
  children: ReactNode;
  user: GetProfileResponse | null;
}) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const patchUser = useCallback((patch: Partial<GetProfileResponse>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      patchUser,
    }),
    [user, patchUser],
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}
