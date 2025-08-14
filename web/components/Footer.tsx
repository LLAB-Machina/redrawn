import Container from "./Container";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white/60">
      <Container>
        <div className="flex h-16 items-center justify-between text-sm text-neutral-600">
          <div>© {new Date().getFullYear()} Redrawn</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-neutral-900">
              Home
            </Link>
            <Link href="/app" className="hover:text-neutral-900">
              App
            </Link>
            <a
              className="hover:text-neutral-900"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
