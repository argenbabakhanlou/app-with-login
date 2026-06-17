import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const revalidate = 30;

export default async function Home() {
  const session = await auth();
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-zinc-500 mb-6">
          A public feed of notes.{" "}
          {session?.user ? (
            <Link href="/dashboard" className="text-zinc-900 font-medium hover:underline">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/register" className="text-zinc-900 font-medium hover:underline">
              Sign up
            </Link>
          )}{" "}
          {session?.user ? "to add your notes." : "to add your own."}
        </p>

        {notes.length === 0 ? (
          <p className="text-sm text-zinc-400">No notes yet. Be the first to write one.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                <p className="text-sm text-zinc-800 whitespace-pre-wrap">{note.content}</p>
                <p className="mt-3 text-xs text-zinc-400">
                  {note.user.name || note.user.email} ·{" "}
                  {new Date(note.createdAt).toLocaleString()}
                  {note.updatedAt.getTime() !== note.createdAt.getTime() && " · edited"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
