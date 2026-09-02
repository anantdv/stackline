import { Link } from "react-router";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

/**
 * Navbar auth slot — renders Sign in ghost when logged out, and a
 * user chip (avatar + name + role) with logout when authenticated.
 */
export default function AuthSlot({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <span className="h-9 w-24 animate-pulse rounded-lg border border-line bg-surface" />
    );
  }

  if (!user) {
    return (
      <Link
        to={LOGIN_PATH}
        onClick={onNavigate}
        className="rounded-lg border border-linestrong px-4 py-2 text-sm font-medium text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
      >
        Sign in
      </Link>
    );
  }

  const initials = (user.name || user.email || "U")
    .split(/[\s@]+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-linestrong py-1 pl-1 pr-3 transition-colors duration-300 hover:border-brand"
        >
          <Avatar className="h-7 w-7">
            {user.avatar ? <AvatarImage src={user.avatar} alt={user.name ?? "user"} /> : null}
            <AvatarFallback className="bg-brand-soft font-mono text-[10px] text-brand">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate text-sm font-medium text-ink0">
            {user.name ?? user.email ?? "User"}
          </span>
          <span
            className={
              user.role === "admin"
                ? "rounded-sm bg-brand-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-brand"
                : "rounded-sm bg-data-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-data"
            }
          >
            {user.role}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          {user.email ?? "Signed in"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link to="/admin" onClick={onNavigate} className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4 text-brand" />
              Admin console
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <UserRound className="mr-2 h-4 w-4" />
            User role — floor ops
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="cursor-pointer text-crit focus:text-crit"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
