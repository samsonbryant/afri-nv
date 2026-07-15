"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/dashboard/hooks/use-dashboard";
import { formatRelative } from "@/lib/utils/format";

export function NotificationsDropdown() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = notifications.filter((item) => !item.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unread > 0 ? (
            <span className="bg-primary absolute right-1.5 top-1.5 h-2 w-2 rounded-full" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 ? (
            <button
              type="button"
              className="text-primary focus-visible:ring-ring text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2"
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-sm">
            You&apos;re all caught up.
          </div>
        ) : (
          notifications.slice(0, 8).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex flex-col items-start gap-1 py-3"
              onClick={() => {
                if (!item.read) markRead.mutate(item.id);
              }}
              asChild={Boolean(item.href)}
            >
              {item.href ? (
                <Link href={item.href}>
                  <span className="flex w-full items-start justify-between gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {!item.read ? (
                      <span className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                    ) : null}
                  </span>
                  {item.body ? (
                    <span className="text-muted-foreground text-xs">{item.body}</span>
                  ) : null}
                  <span className="text-muted-foreground text-[11px]">
                    {formatRelative(item.createdAt)}
                  </span>
                </Link>
              ) : (
                <>
                  <span className="flex w-full items-start justify-between gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {!item.read ? (
                      <span className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                    ) : null}
                  </span>
                  {item.body ? (
                    <span className="text-muted-foreground text-xs">{item.body}</span>
                  ) : null}
                  <span className="text-muted-foreground text-[11px]">
                    {formatRelative(item.createdAt)}
                  </span>
                </>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
