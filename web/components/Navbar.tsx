import Link from "next/link";
import Container from "./Container";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import {
  useGetV1MeQuery,
  usePostV1AuthLogoutMutation,
  useGetV1AdminPricesQuery,
  type User,
} from "../src/services/genApi";

type NavbarProps = { initialMe?: User | null };

export default function Navbar({ initialMe }: NavbarProps) {
  const [dark, setDark] = useState(false);
  const { data: me, error: meError } = useGetV1MeQuery(undefined);
  const [logout] = usePostV1AuthLogoutMutation();
  const user = initialMe ?? me;
  const isAuthed = !(meError && (meError as any).status === 401) && !!user;
  const { error: adminError, isLoading: adminLoading } =
    useGetV1AdminPricesQuery(undefined as any, { skip: !isAuthed });
  const isAdmin = isAuthed && !adminLoading && !adminError;
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container>
        <nav className="flex h-14 items-center gap-4">
          <Link
            href="/"
            className="mr-auto text-base font-semibold tracking-tight"
          >
            Redrawn
          </Link>
          <Link className="text-sm text-neutral-700 hover:text-black" href="/">
            Home
          </Link>
          <Link
            className="text-sm text-neutral-700 hover:text-black"
            href="/app"
          >
            App
          </Link>
          <Link
            className="text-sm text-neutral-700 hover:text-black"
            href="/app/themes"
          >
            Themes
          </Link>
          <Link
            className="text-sm text-neutral-700 hover:text-black"
            href="/billing"
          >
            Billing
          </Link>
          {isAdmin && (
            <Link
              className="text-sm text-neutral-700 hover:text-black"
              href="/admin/prices"
            >
              Admin
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="btn btn-neutral h-9 px-3"
            aria-label="Toggle theme"
          >
            {dark ? (
              <MoonIcon className="h-4 w-4" />
            ) : (
              <SunIcon className="h-4 w-4" />
            )}
          </button>
          {!(meError && (meError as any).status === 401) && user ? (
            <>
              <Link className="btn btn-ghost h-9 px-3" href="/app">
                {user.name || user.email || "Account"}
              </Link>
              <button
                className="btn btn-primary h-9 px-3"
                onClick={async () => {
                  try {
                    await logout(undefined).unwrap();
                  } catch {}
                  window.location.href = "/";
                }}
                type="button"
              >
                Log out
              </button>
            </>
          ) : (
            <Link className="btn btn-primary h-9 px-3" href="/signup">
              Sign in
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}
