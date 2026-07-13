"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CalendarDays, CreditCard, ShoppingBag, Ticket, User, LogOut, Menu, LayoutDashboard, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"

// Agregamos la opción de Familia a la lista maestra. 
// requireHijos es una bandera nueva para controlarla.
const TODAS_LAS_OPCIONES = [
  { titulo: "Panel Principal", icono: LayoutDashboard, href: "/alumno", requiereReservas: false, requiereHijos: false },
  { titulo: "Inscripción", icono: CalendarDays, href: "/alumno/reservas", requiereReservas: true, requiereHijos: false }, 
  { titulo: "Billetera", icono: CreditCard, href: "/alumno/billetera", requiereReservas: false, requiereHijos: false },
  { titulo: "Tienda", icono: ShoppingBag, href: "/alumno/tienda", requiereReservas: true, requiereHijos: false }, 
  { titulo: "Eventos", icono: Ticket, href: "/alumno/eventos", requiereReservas: true, requiereHijos: false },
  { titulo: "Mi Perfil", icono: User, href: "/alumno/perfil", requiereReservas: false, requiereHijos: false },
  { titulo: "Grupo Familiar", icono: Users, href: "/alumno/familia", requiereReservas: false, requiereHijos: true },
]

export default function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)
  
  // Estado real conectado a la BD
  const [usaReservas, setUsaReservas] = useState<boolean>(true)
  const [nombreAcademia, setNombreAcademia] = useState("Mi Academia")
  const [tieneHijos, setTieneHijos] = useState(false)

  useEffect(() => {
    const cargarConfiguracionAcademiaYFamilia = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscamos a qué academia pertenece
      const { data: usuario } = await supabase.from('usuarios').select('academia_id').eq('id', user.id).single()
      
      if (usuario?.academia_id) {
        // Leemos la configuración de esa academia
        const { data: academia } = await supabase.from('academias').select('nombre, usa_reservas').eq('id', usuario.academia_id).single()
        if (academia) {
          setNombreAcademia(academia.nombre)
          setUsaReservas(academia.usa_reservas)
        }
      }

      // Verificamos si tiene familiares a cargo (Hijos)
      const { count } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('titular_id', user.id)

      if (count && count > 0) {
        setTieneHijos(true)
      }
    }
    cargarConfiguracionAcademiaYFamilia()
  }, [])

  // Filtramos el menú según la BD y la estructura familiar
  const menuFiltrado = TODAS_LAS_OPCIONES.filter(item => {
    if (!usaReservas && item.requiereReservas) return false;
    if (item.requiereHijos && !tieneHijos) return false; // Filtra "Grupo Familiar" si no hay hijos
    return true;
  })

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-sm font-black uppercase tracking-widest text-primary truncate">{nombreAcademia}</span>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-4">
          {menuFiltrado.map((item) => {
            const activo = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icono className="h-5 w-5" /> {item.titulo}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleCerrarSesion}>
            <LogOut className="h-5 w-5" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <span className="text-sm font-black uppercase tracking-widest text-primary truncate">{nombreAcademia}</span>
          <Button variant="ghost" size="icon" onClick={() => setMenuAbierto(!menuAbierto)} className="text-primary"><Menu className="h-6 w-6" /></Button>
        </header>

        {menuAbierto && (
          <div className="border-b border-border bg-card p-4 lg:hidden z-50 relative shadow-md">
            <nav className="flex flex-col gap-2">
              {menuFiltrado.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuAbierto(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  <item.icono className="h-5 w-5" /> {item.titulo}
                </Link>
              ))}
              <Button variant="ghost" className="mt-2 justify-start gap-3 text-destructive" onClick={handleCerrarSesion}>
                <LogOut className="h-5 w-5" /> Cerrar sesión
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