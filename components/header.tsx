import { auth, signOut } from "@/auth";
import Link from "next/link";

const btnLight = "text-sm rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="bg-white border-b border-zinc-200">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className={btnLight}>
          Home
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={btnLight}>
                Dashboard
              </Link>
              <Link href="/settings" className={btnLight}>
                {user.name || user.email}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className={btnLight}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={btnLight}>
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm rounded-lg bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
