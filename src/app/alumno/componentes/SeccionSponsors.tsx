"use client"

import { Star } from "lucide-react"

export default function SeccionSponsors({ patrocinadores, academiaNombre }: any) {
  if (patrocinadores.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-border/50">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest text-center">
          Apoyan a {academiaNombre || "nuestra academia"}
        </h3>
        <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
      </div>
      
      <div className="flex flex-wrap justify-center gap-6">
        {patrocinadores.map((sponsor: any) => {
          const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
          const ContenedorSponsor = flex.link ? 'a' : 'div'
          
          return (
            <ContenedorSponsor 
              key={sponsor.id} 
              href={flex.link || undefined} 
              target={flex.link ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-3 w-[120px] ${flex.link ? 'hover:scale-105 transition-transform cursor-pointer' : ''}`}
            >
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2">
                {flex.logo_url ? (
                  <img src={flex.logo_url} alt={sponsor.nombre} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                ) : (
                  <span className="font-black text-slate-300 text-3xl uppercase">{sponsor.nombre.charAt(0)}</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wide leading-tight px-2">
                {sponsor.nombre}
              </span>
            </ContenedorSponsor>
          )
        })}
      </div>
    </div>
  )
}