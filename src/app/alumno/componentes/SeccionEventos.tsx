"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Ticket, MapPin, Sparkles } from "lucide-react"

export default function SeccionEventos({ eventosEspeciales, perfilActivo, handleAnotarseWpp, handleAnotarseCredito, formatearFecha }: any) {
  if (eventosEspeciales.length === 0) return null;

  return (
    <div className="space-y-4 mt-12">
      <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" /> Eventos & Workshops
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventosEspeciales.map((ev: any) => {
          const anotadas = ev.reservas_confirmadas?.length || 0
          const lugaresDisponibles = ev.cupo_maximo - anotadas
          const estaLlena = lugaresDisponibles <= 0
          const yaAnotada = ev.reservas_confirmadas?.some((r: any) => r.alumno_id === perfilActivo?.id)
          
          const precioReal = ev.precio || 0
          const esEventoPagoMonetario = ev.costo_creditos === 0 && precioReal > 0

          return (
            <Card key={ev.id} className={`flex flex-col rounded-2xl overflow-hidden transition-all bg-card ${yaAnotada ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
              <div className="h-48 relative bg-secondary/30 flex items-center justify-center overflow-hidden">
                {ev.imagen_url ? (
                  <>
                    <img src={ev.imagen_url} alt={ev.titulo} className="absolute inset-0 w-full h-full object-cover z-0" />
                    <div className="absolute inset-0 bg-black/20 z-0" />
                  </>
                ) : (
                  <Ticket className="h-16 w-16 text-primary/20" />
                )}
                
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm text-foreground px-3 py-2 rounded-xl text-xs font-black uppercase shadow-lg border border-border/50 text-center leading-tight z-10">
                  {formatearFecha(ev.fecha)} <br/>
                  <span className="text-primary">{ev.hora_inicio.slice(0,5)}hs</span>
                </div>

                {yaAnotada && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-10">
                    Anotada
                  </div>
                )}
              </div>

              <CardContent className="p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-black uppercase text-foreground leading-tight mb-3">
                  {ev.titulo}
                </h3>
                
                <p className="text-muted-foreground text-sm flex-1 mb-6">
                  {ev.descripcion_evento || "Evento especial programado."}
                </p>
                
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md"><MapPin className="h-4 w-4" /> Sede Principal</span>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${estaLlena ? 'bg-destructive/10 text-destructive' : 'bg-secondary/50'}`}>
                    <Users className="h-4 w-4" /> {anotadas}/{ev.cupo_maximo} lugares
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-5 border-t border-border gap-4">
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Valor</p>
                    <span className="text-2xl font-black text-foreground">
                      {esEventoPagoMonetario ? `$${precioReal.toLocaleString('es-AR')}` : `${ev.costo_creditos} Crédito${ev.costo_creditos !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => esEventoPagoMonetario ? handleAnotarseWpp(ev) : handleAnotarseCredito(ev)}
                    disabled={estaLlena || yaAnotada}
                    className={`font-bold uppercase tracking-widest text-xs h-12 px-6 transition-all shadow-sm ${
                      esEventoPagoMonetario && !yaAnotada && !estaLlena 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : yaAnotada ? 'bg-secondary text-foreground opacity-100 cursor-default'
                        : estaLlena ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {yaAnotada ? "Ya estás anotada" : estaLlena ? "Agotado" : "Anotarme"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}