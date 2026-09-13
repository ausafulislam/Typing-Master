import Link from "next/link"
import { Keyboard, Home, Gamepad2, ShieldCheck } from "lucide-react"

const linkClasses =
  "inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"

const footerLinks = [
  { href: "/", label: "Home", icon: <Home className="w-3.5 h-3.5" /> },
  { href: "/game", label: "Play", icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { href: "/verify", label: "Verify", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
]

export function Footer() {
  return (
    <footer className="print:hidden border-t-2 border-foreground bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground border-2 border-foreground p-1">
            <Keyboard className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tight">TypeMaster</span>
        </div>
        <nav aria-label="Footer navigation" className="flex items-center gap-3 sm:gap-5">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses}>
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
          &copy; 2026 Ausaf Ul Islam
        </p>
      </div>
    </footer>
  )
}
