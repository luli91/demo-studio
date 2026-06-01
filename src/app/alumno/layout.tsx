"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  CalendarDays, 
  CreditCard, 
  ShoppingBag, 
  Ticket, 
  User, 
  LogOut, 
  Menu,
  LayoutDashboard
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"

// Dejamos de usar una constante fija y pasamos a definir todas las opciones posibles
const TODAS_LAS_OPCIONES = [
  { titulo: "Panel Principal", icono: LayoutDashboard, href: "/alumno", requiereReservas: false },
  { titulo: "Inscripción", icono: CalendarDays, href: "/alumno/reservas", requiereReservas: true }, // Solo para Packs/Pole
  { titulo: "Billetera", icono: CreditCard, href: "/alumno/billetera", requiereReservas: false },
  { titulo: "Tienda", icono: ShoppingBag, href: "/alumno/tienda", requiereReservas: false },
  { titulo: "Eventos", icono: Ticket, href: "/alumno/eventos", requiereReservas: false },
  { titulo: "Mi Perfil", icono: User, href: "/alumno/perfil", requiereReservas: false },
]

export default function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

 // ⚠️ SIMULADOR DE NEGOCIO (Usamos string genérico para que TS no moleste)
  const modeloNegocio: string = "reservas";

  // Filtramos el menú: si es "mensual", sacamos las opciones que requieren reservas
  const menuFiltrado = TODAS_LAS_OPCIONES.filter(item => {
    if (modeloNegocio === "mensual" && item.requiereReservas) return false;
    return true;
  })

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-lg font-bold tracking-tight text-primary">Mi Academia</span>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-4">
          {menuFiltrado.map((item) => {
            const activo = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activo 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icono className="h-5 w-5" />
                {item.titulo}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleCerrarSesion}>
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Header - Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <span className="text-lg font-bold text-primary">Mi Academia</span>
          <Button variant="ghost" size="icon" onClick={() => setMenuAbierto(!menuAbierto)} className="text-primary">
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Menú desplegable Mobile */}
        {menuAbierto && (
          <div className="border-b border-border bg-card p-4 lg:hidden z-50 relative shadow-md">
            <nav className="flex flex-col gap-2">
              {menuFiltrado.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                    pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <item.icono className="h-5 w-5" />
                  {item.titulo}
                </Link>
              ))}
              <Button variant="ghost" className="mt-2 justify-start gap-3 text-destructive" onClick={handleCerrarSesion}>
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </Button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}