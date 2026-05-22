import Link from "next/link";
import { Dot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailRowProps {
  senderName: string;
  senderEmail: string;
  subject: string;
  time: string;
  isUrgent: boolean;
  href: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function EmailRow({
  senderName,
  senderEmail,
  subject,
  time,
  isUrgent,
  href,
}: EmailRowProps) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-start gap-3 rounded-md border-b px-2 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium ${
          isUrgent ? "ring-2 ring-red-500/40" : ""
        }`}
      >
        {getInitials(senderName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="font-medium">{senderName}</span>
          <span className="text-muted-foreground"> · {senderEmail}</span>
        </p>
        <p className="line-clamp-1 text-sm text-foreground/80">{subject}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs tabular-nums text-muted-foreground">{time}</span>
        {isUrgent && (
          <Badge variant="destructive" className="gap-0 pl-0.5 text-xs">
            <Dot className="size-3.5" />
            Urgent
          </Badge>
        )}
      </div>
    </Link>
  );
}
