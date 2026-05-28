import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  scrolled: boolean;
  nombreEstudio: string;
}

export default function Navbar({ scrolled, nombreEstudio }: NavbarProps) {
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 py-0' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        {/* Logo Dinámico */}
        <div className={`font-black text-2xl tracking-tighter uppercase transition-colors ${scrolled ? 'text-slate-900' : 'text-slate-800 lg:text-white'}`}>
          {nombreEstudio}
        </div>
        
        {/* Menú de navegación */}
        <div className={`hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest transition-colors ${scrolled ? 'text-slate-500' : 'text-slate-600'}`}>
          <a href="#clases" className="hover:text-slate-900 transition-colors">Clases</a>
          <a href="#galeria" className="hover:text-slate-900 transition-colors">Estudio</a>
          <a href="#eventos" className="hover:text-slate-900 transition-colors">Eventos</a>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline" className={`rounded-none font-black uppercase tracking-widest text-[10px] h-10 hidden sm:flex transition-colors bg-transparent ${scrolled ? 'border-slate-200 text-slate-900 hover:bg-slate-50' : 'border-slate-800 text-slate-900 lg:border-white/30 lg:text-white lg:hover:bg-white/10'}`}>
              Acceso Alumnas
            </Button>
          </Link>
          <Link href="/registro">
            <Button className={`rounded-none font-black uppercase tracking-widest text-[10px] h-10 transition-colors ${scrolled ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-900 text-white lg:bg-white lg:text-slate-900 lg:hover:bg-slate-100'}`}>
              Registrarme
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}