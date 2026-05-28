import Link from "next/link"
import { Button } from "@/components/ui/button"

interface FooterProps {
  nombreEstudio: string;
  whatsapp: string;
}

export default function Footer({ nombreEstudio, whatsapp }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-20 px-6 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
        
        <div className="space-y-6 text-center md:text-left">
          <div className="font-black text-3xl tracking-tighter uppercase text-slate-900">
            {nombreEstudio}
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Potenciando el movimiento en cada clase.
          </p>
        </div>
        
        <div className="space-y-4 text-center md:text-left">
          <h4 className="font-black uppercase text-xs tracking-widest border-b pb-2 inline-block">
            Contacto
          </h4>
          <div className="space-y-3 pt-2 flex flex-col items-center md:items-start text-slate-500 font-bold text-sm">
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors italic">
              WhatsApp
            </a>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end justify-between">
          <Link href="/login">
            <Button variant="outline" className="rounded-none border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black uppercase px-8">
              Portal Alumnas
            </Button>
          </Link>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-4">
            © {currentYear} {nombreEstudio}.
          </p>
        </div>
        
      </div>
    </footer>
  )
}