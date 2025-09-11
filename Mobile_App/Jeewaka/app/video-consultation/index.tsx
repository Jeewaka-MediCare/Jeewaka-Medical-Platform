import React from "react";
import { useRouter } from "expo-router";

export default function VideoConsultationIndex() {
  const router = useRouter();

  // Automatically redirect to create a new meeting
  React.useEffect(() => {
    router.replace("/video-consultation/new" as any);
  }, []);

  return null;
}
