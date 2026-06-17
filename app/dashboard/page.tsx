import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Notes } from "./notes";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Notes />
      </main>
    </div>
  );
}
