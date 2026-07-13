"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function EstadoCuenta({ familiaresQueEntrenan, usaReservas }: any) {
  return (
    <div className="border-t border-border pt-4">
      <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground mb-4">Estado de Cuenta Familiar</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {familiaresQueEntrenan.map((fliar: any) => {
          if (usaReservas) {
            return (
              <div key={fliar.id} className="flex items-center gap-4 bg-secondary/30 px-5 py-4 rounded-xl border border-border">
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{fliar.nombre}</span>
                  <span className="text-xl font-bold text-foreground">{fliar.creditos} Créditos</span>
                </div>
                <Button asChild size="sm" variant="outline"><Link href="/alumno/tienda">Recargar</Link></Button>
              </div>
            )
          } else {
            const tieneDeuda = fliar.estado_cuota === "vencida" || fliar.estado_cuota === "deuda"
            return (
              <Card key={fliar.id} className={`border-2 shadow-sm ${tieneDeuda ? "border-destructive/50 bg-destructive/5" : "border-emerald-500/20 bg-emerald-50/50"}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  {tieneDeuda ? (
                    <div className="bg-destructive/10 p-2 rounded-full text-destructive shrink-0"><AlertCircle className="h-6 w-6" /></div>
                  ) : (
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0"><CheckCircle2 className="h-6 w-6" /></div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">{fliar.nombre}</span>
                    <h3 className="text-sm font-bold">{tieneDeuda ? "Cuota pendiente" : "Cuota al día"}</h3>
                  </div>
                </CardContent>
              </Card>
            )
          }
        })}
      </div>
    </div>
  )
}