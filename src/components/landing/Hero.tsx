import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface HeroProps {
  config: {
    nombreEstudio: string;
    hero: {
      foto_portada: string;
      frase_streets: string;
    };
  };
}

export default function Hero({ config }: HeroProps) {
  const nameParts = config.nombreEstudio.split(' ');
  const firstPart = nameParts[0] || 'SYNC';
  const secondPart = nameParts.slice(1).join(' ') || 'STUDIO';

  return (
    <section className="relative min-h-screen pt-20">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-900 hidden lg:block z-0"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center">
        
        {/* Columna Izquierda: Textos y Botones */}
        <div className="flex-1 px-6 py-12 lg:py-0 space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
          <div className="space-y-4">
            <h2 className="text-slate-500 font-black text-xs uppercase tracking-[0.4em]">
              Gestión y Reservas
            </h2>
            <div className="relative">
              <h1 className="text-8xl md:text-[11rem] font-black leading-none tracking-tighter text-slate-900 uppercase flex flex-col">
                <span className="z-10 relative">{firstPart}</span>
                {/* Con -mt-6 (mobile) y -mt-16 (desktop) forzamos a que las palabras se toquen/superpongan */}
                <span className="text-transparent -mt-6 md:-mt-16 relative z-20" style={{ WebkitTextStroke: '2px #0f172a' }}>
                  {secondPart}
                </span>
              </h1>
              
              {/* LOGO FLOTANTE */}
              <div className="absolute top-1/2 right-0 md:right-5 -translate-y-1/2 animate-bounce duration-[3000ms]">
                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                  <img src="/logo-sync.png" alt="Logo Sync Studio" className="w-full h-full object-contain drop-shadow-2xl" />
                </div>
              </div>

            </div>
          </div>
          
          <div className="max-w-md space-y-6">
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              {config.hero.frase_streets}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="flex-1">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-16 rounded-none font-black uppercase tracking-widest transition-all">
                  Ingresar <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/registro" className="flex-1">
                <Button variant="outline" className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white h-16 rounded-none font-black uppercase tracking-widest transition-all">
                  Registrarme
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Imagen de Portada y Sello Circular */}
        <div className="flex-1 relative w-full h-[60vh] lg:h-[calc(100vh-80px)] animate-in fade-in slide-in-from-right-10 duration-1000 z-10">
          <img 
            src={config.hero.foto_portada} 
            alt="Portada del Estudio" 
            className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700" 
          />
          
          {/* SELLO CIRCULAR ANIMADO */}
          <div className="absolute -left-16 bottom-20 hidden xl:block">
            <div className="relative w-32 h-32 flex items-center justify-center animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="text-[10px] font-black uppercase tracking-[0.15em] fill-slate-900">
                  <textPath xlinkHref="#circlePath">
                    • {config.nombreEstudio} • {config.nombreEstudio}
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </section>
  )
}