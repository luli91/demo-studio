"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { CalendarCheck, DollarSign, User, LogOut, Menu, X, LayoutDashboard } from "lucide-react"

const OPCIONES_PROFE = [
  { label: "Mi Grilla", path: "/profesor", icon: <CalendarCheck className="h-5 w-5" /> },
  { label: "Mi Actividad", path: "/profesor/actividad", icon: <DollarSign className="h-5 w-5" /> },
  { label: "Mi Perfil", path: "/profesor/perfil", icon: <User className="h-5 w-5" /> },
]

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground font-sans">
      
      {/* BOTÓN HAMBURGUESA PARA MÓVILES */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-primary p-2 rounded-md text-primary-foreground shadow-lg"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* OVERLAY DE MENÚ MÓVIL */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* BARRA LATERAL (ASIDE) */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-950 text-slate-50 p-8 flex flex-col z-40 transform transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl border-r border-border/10`}>
        
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-3">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white leading-none uppercase mt-1">
            PORTAL<span className="text-primary font-black ml-1">PROFE</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold italic">Docencia & Planillas</p>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {OPCIONES_PROFE.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === item.path 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* BOTÓN DE CIERRE DE SESIÓN */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={handleCerrarSesion}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors font-bold text-sm"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen bg-background">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}