import { Link } from "react-router";
import { motion } from "framer-motion";
import { ShieldCheck, UserRound, Lock, ArrowRight } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { PrimaryButton } from "@/components/Buttons";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { trpc } from "@/providers/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function Gate({
  kicker,
  title,
  blurb,
  cta,
}: {
  kicker: string;
  title: string;
  blurb: string;
  cta?: { to: string; label: string };
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
      <SectionKicker>{kicker}</SectionKicker>
      <Lock className="mt-6 h-10 w-10 text-brand" />
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink0">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-ink1">{blurb}</p>
      {cta ? (
        <div className="mt-8">
          <PrimaryButton to={cta.to}>{cta.label}</PrimaryButton>
        </div>
      ) : null}
    </main>
  );
}

export default function Admin() {
  const { user, isLoading } = useAuth();
  const utils = trpc.useUtils();

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    retry: false,
  });
  const setRole = trpc.users.setRole.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
      toast.success("ROLE UPDATED");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[70vh] items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink1">
          Verifying session…
        </span>
      </main>
    );
  }

  if (!user) {
    return (
      <Gate
        kicker="ACCESS.REQUIRED"
        title="Sign in to continue"
        blurb="The admin console is restricted to signed-in administrators. Sign in with your Kimi account to review users, roles and live system access."
        cta={{ to: LOGIN_PATH, label: "Sign in" }}
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Gate
        kicker="ROLE.USER"
        title="Administrator role required"
        blurb={`You are signed in as ${user.email ?? user.name ?? "a user"} with the USER role — you can run floor operations (scanning, movements, gate), but user management and system configuration are admin-only. Ask an administrator to promote your account.`}
      />
    );
  }

  const users = usersQuery.data ?? [];
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-28">
      <SectionKicker>ADMIN.CONSOLE</SectionKicker>
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink0"
        data-tour="admin-header"
      >
        Access &amp; roles
      </motion.h1>
      <p className="mt-4 max-w-2xl text-ink1">
        Every account signs in with Kimi. The app creator is Administrator by
        default; promote trusted teammates to admin, keep everyone else on the
        User role for floor operations.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3" data-tour="admin-stats">
        <BlueprintCard className="p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
            Total accounts
          </div>
          <div className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink0">
            {usersQuery.isLoading ? "—" : users.length}
          </div>
        </BlueprintCard>
        <BlueprintCard className="p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
            Administrators
          </div>
          <div className="mt-2 font-display text-4xl font-semibold tabular-nums text-brand">
            {usersQuery.isLoading ? "—" : admins}
          </div>
        </BlueprintCard>
        <BlueprintCard className="p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
            Users
          </div>
          <div className="mt-2 font-display text-4xl font-semibold tabular-nums text-data">
            {usersQuery.isLoading ? "—" : users.length - admins}
          </div>
        </BlueprintCard>
      </div>

      <div data-tour="admin-table"><BlueprintCard className="mt-6 overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
            // USER.REGISTRY
          </span>
        </div>
        {usersQuery.isLoading ? (
          <div className="p-6 font-mono text-xs uppercase tracking-[0.14em] text-ink1">
            Loading accounts…
          </div>
        ) : usersQuery.isError ? (
          <div className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-crit">
              Could not load users — the database may still be initializing.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => usersQuery.refetch()}
                className="rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors hover:border-brand hover:text-brand"
              >
                Retry
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 font-mono text-xs uppercase tracking-[0.14em] text-ink1">
            No accounts yet — the next sign-in appears here.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Last sign-in</th>
                <th className="px-6 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-line/60 last:border-0 hover:bg-raised/40"
                >
                  <td className="px-6 py-3 font-medium text-ink0">
                    {u.name ?? "—"}
                    {u.id === user.id ? (
                      <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-data">
                        you
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-3 text-ink1">{u.email ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs tabular-nums text-ink1">
                    {u.lastSignInAt
                      ? new Date(u.lastSignInAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <Select
                      value={u.role}
                      onValueChange={(role) =>
                        setRole.mutate({ id: u.id, role: role as "user" | "admin" })
                      }
                      disabled={setRole.isPending}
                    >
                      <SelectTrigger className="h-8 w-36 font-mono text-xs uppercase tracking-[0.1em]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <span className="flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5 text-data" /> User
                          </span>
                        </SelectItem>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Admin
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </BlueprintCard></div>

      <div data-tour="admin-policy"><BlueprintCard className="mt-6 p-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
          // ROLE.POLICY
        </span>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-brand">
              <ShieldCheck className="h-4 w-4" /> Administrator
            </div>
            <p className="mt-2 text-sm text-ink1">
              Full control: warehouse layout editing, ERPNext connection &amp;
              sync, allocation execution, compliance document generation,
              transport planning, fleet optimization, user management.
            </p>
          </div>
          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-data">
              <UserRound className="h-4 w-4" /> User
            </div>
            <p className="mt-2 text-sm text-ink1">
              Floor operations: record scans, create and complete stock
              movements, schedule and advance gate passes. Read-only everywhere
              else.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-brand hover:gap-3 transition-all"
        >
          Open the global dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </BlueprintCard></div>
    </main>
  );
}
