"use client";

import { useEffect } from "react";
import { useStatsStore } from "@/stores/useStatsStore";
import { nanoid } from "nanoid";

interface ViewTrackerProps {
  blogId: string;
  userId?: string;
}

export default function ViewTracker({ blogId, userId }: ViewTrackerProps) {
  const { recordView } = useStatsStore();

  useEffect(() => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = nanoid();
      sessionStorage.setItem("session_id", sessionId);
    }

    // Record view
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;

    recordView(blogId, sessionId, userId, userAgent, referrer);
  }, [blogId, userId, recordView]);

  return null;
}
