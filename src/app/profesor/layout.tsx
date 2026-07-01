"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { LayoutDashboard, Users, CalendarDays, Image as ImageIcon, Wallet, Settings, LogOut, Menu, X, GraduationCap } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // ESTADO DINÁMICO: Por defecto es "mensual" (oculta la grilla)
  const [modeloNegocio, setModeloNegocio] = useState<string>("mensual")

  useEffect(() => {
    const fetchConfiguracion = async () => {
      // Vamos a la BD y leemos si esta academia usa reservas o cuota fija
      const { data } = await supabase.from('academias').select('usa_reservas').limit(1).single()
      
      if (data && data.usa_reservas === true) {
        setModeloNegocio("reservas") // Si usa reservas, activamos la Grilla
      }
    }
    fetchConfiguracion()
  }, [supabase])

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // MENÚ INTELIGENTE
  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Directorio", path: "/admin/alumnos", icon: <Users className="h-5 w-5" /> },
    { label: "Staff", path: "/admin/staff", icon: <GraduationCap className="h-5 w-5" /> },
    
    // Inyección dinámica: Solo se agrega si el modelo NO es mensual
    ...(modeloNegocio !== 'mensual' 
      ? [{ label: "Grilla", path: "/admin/clases", icon: <CalendarDays className="h-5 w-5" /> }] 
      : []),
      
    { label: "Multimedia", path: "/admin/multimedia", icon: <ImageIcon className="h-5 w-5" /> },
    { label: "Finanzas", path: "/admin/finanzas", icon: <Wallet className="h-5 w-5" /> },
    { label: "Configuración", path: "/admin/config", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground font-sans">
      
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-primary p-2 rounded-md text-primary-foreground shadow-lg"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-950 text-slate-50 p-8 flex flex-col z-40 transform transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl border-r border-border/10`}>
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-3">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white leading-none uppercase mt-1">
            MANAGER<span className="text-primary font-black ml-1">PRO</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold italic">Panel de Comando</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.path ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              {item.icon}
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={handleCerrarSesion}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors font-bold text-sm"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen bg-background">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}