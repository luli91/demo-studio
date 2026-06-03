"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CalendarCheck, DollarSign, LogOut, Menu, User } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"

const OPCIONES_PROFE = [
  { titulo: "Mi Grilla", icono: CalendarCheck, href: "/profesor" },
  { titulo: "Mis Honorarios", icono: DollarSign, href: "/profesor/honorarios" },
  { titulo: "Mi Perfil", icono: User, href: "/profesor/perfil" },
]

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-secondary/10 text-foreground">
      
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex shadow-sm z-10">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-lg font-black tracking-tight text-primary uppercase">Portal Profesor</span>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-4">
          {OPCIONES_PROFE.map((item) => {
            const activo = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  activo ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icono className="h-5 w-5" />
                {item.titulo}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive font-bold" onClick={handleCerrarSesion}>
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden sticky top-0 z-40 shadow-sm">
          <span className="text-lg font-black text-primary uppercase">Portal Profesor</span>
          <Button variant="ghost" size="icon" onClick={() => setMenuAbierto(!menuAbierto)} className="text-primary">
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {menuAbierto && (
          <div className="border-b border-border bg-card p-4 lg:hidden z-50 absolute top-16 w-full shadow-lg animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2">
              {OPCIONES_PROFE.map((item) => {
                const activo = pathname === item.href
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMenuAbierto(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      activo ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <item.icono className="h-5 w-5" />
                    {item.titulo}
                  </Link>
                )
              })}
              <Button variant="ghost" className="mt-2 justify-start gap-3 text-destructive font-bold px-4" onClick={handleCerrarSesion}>
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </Button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  )
}