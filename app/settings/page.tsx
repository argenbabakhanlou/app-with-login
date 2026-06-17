import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Settings</h1>
        <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Name</p>
            <p className="text-sm text-zinc-800">{session.user.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm text-zinc-800">{session.user.email}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
