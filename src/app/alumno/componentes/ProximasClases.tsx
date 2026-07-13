"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function ProximasClases({ usaReservas, proximasClases, perfilActivo }: any) {
  if (!usaReservas) return null
  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Próximas Clases de {perfilActivo?.nombre.split(" ")[0]}</h3>
      {proximasClases.length > 0 ? (
        <div className="grid gap-4">
          {proximasClases.map((clase: any) => (
            <Card key={clase.id} className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardContent className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground rounded-2xl p-3 text-center min-w-[65px] shadow-inner">
                    <div className="text-[10px] uppercase font-bold opacity-90">{new Date(clase.fecha).toLocaleDateString('es-AR', {weekday: 'short'})}</div>
                    <div className="text-2xl font-black">{clase.fecha.split('-')[2]}</div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold uppercase tracking-tight">{clase.titulo}</h4>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold"><Clock className="h-3.5 w-3.5" /> {clase.hora_inicio.slice(0,5)} hs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-2xl border-2 border-dashed">
          Aún no tenés reservas activas.
        </div>
      )}
    </div>
  )
}