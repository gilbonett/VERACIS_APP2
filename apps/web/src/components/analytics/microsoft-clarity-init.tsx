"use client";

import { env } from "@/public-env";
import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

/**
 *
 *
 * @see https://www.npmjs.com/package/@microsoft/clarity
 */
export function MicrosoftClarityInit() {
  useEffect(() => {
    const projectId = env.CLARITY_PROJECT_ID;
    if (!projectId) return;
    Clarity.init(projectId);
  }, []);

  return null;
}
