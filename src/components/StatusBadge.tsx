import React from "react";
import { QueueStatus } from "@prisma/client";
import { useLanguage } from "./LanguageContext";

interface StatusBadgeProps {
  status: QueueStatus | string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { t } = useLanguage();

  let bg = "#E8E8E8";
  let text = "#555555";
  let label = t("status_cancelled");

  switch (status) {
    case QueueStatus.WAITING:
    case "WAITING":
    case "waiting":
      bg = "#FCE5CD";
      text = "#B45F06";
      label = t("status_waiting");
      break;
    case QueueStatus.CALLED:
    case "CALLED":
    case "called":
      bg = "#DCE9F7";
      text = "#1F5FA8";
      label = t("status_called");
      break;
    case QueueStatus.IN_SERVICE:
    case "IN_SERVICE":
    case "in_service":
      bg = "#EADCF5";
      text = "#6B3FA0";
      label = t("status_in_service");
      break;
    case QueueStatus.COMPLETED:
    case "COMPLETED":
    case "completed":
      bg = "#D9EAD3";
      text = "#2D6A1F";
      label = t("status_completed");
      break;
    case QueueStatus.NO_SHOW:
    case "NO_SHOW":
    case "no_show":
      bg = "#F4CCCC";
      text = "#8B1A1A";
      label = t("status_no_show");
      break;
    case QueueStatus.CANCELLED:
    case "CANCELLED":
    case "cancelled":
    default:
      bg = "#E8E8E8";
      text = "#555555";
      label = t("status_cancelled");
      break;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-full",
    md: "px-2.5 py-1 text-sm font-semibold rounded-full",
    lg: "px-4 py-1.5 text-base font-bold rounded-full",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 justify-center tracking-wide ${sizeClasses}`}
      style={{ backgroundColor: bg, color: text }}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: text }} />
      <span>{label}</span>
    </span>
  );
}
