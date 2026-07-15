"use client";

import Link from "next/link";
import { LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { ROUTES } from "@/lib/constants";
import { useUiStore } from "@/stores/ui-store";

type TopbarProps = {
  title?: string;
};

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const { setSidebarOpen } = useUiStore();
  const { user, organization, logout } = useAuthStore();

  const initials =
    user?.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "NV";

  function handleLogout() {
    logout();
    router.push(ROUTES.login);
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {title ? (
        <h1 className="font-display text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
      ) : (
        <div className="flex-1" />
      )}

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 gap-2 rounded-full px-2"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                {user?.fullName ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName ?? "Guest"}</p>
                <p className="text-muted-foreground text-xs leading-none">
                  {user?.email ?? "Not signed in"}
                </p>
                {organization ? (
                  <p className="text-muted-foreground pt-1 text-xs">{organization.name}</p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.settings}>
                <User className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
