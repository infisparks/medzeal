"use client";
import { usePathname } from "next/navigation";
import EmotionalMessagePopup from "./EmotionalMessagePopup";

const allowedPaths = [
  "/",
  "/doctors",
  "/service",
  "/time-table",
  "/blog-grid",
  "/gallery",
  "/contact",
];

export default function ConditionalEmotionalMessagePopup() {
  const pathname = usePathname();

  // Only render the popup if the current path is in the allowed list
  if (!allowedPaths.includes(pathname)) {
    return null;
  }

  return <EmotionalMessagePopup />;
}
