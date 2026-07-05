"use client"

import { Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function TabReglas({
  esMensual,
  reglas,
  setReglas
}: any) {
  return (
    <div className="max-w-2xl animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card">
        <div className="px-6 py-5 border-b border-border bg-secondary/10">
          <h2 className="font-black text-foreground uppercase tracking-tight">Reglas del Estudio</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {!esMensual && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Límite de Cancelación</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" value={reglas.horasCancelacion} onChange={e => setReglas({...reglas, horasCancelacion: Number(e.target.value)})} className="w-20 bg-background border border-border rounded-xl h-10 px-3 text-center font-bold outline-none focus:border-primary" />
                <span className="text-sm text-muted-foreground font-medium">horas antes</span>
              </div>
              <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">Si cancela con menos tiempo, no se devuelve el crédito.</p>
            </div>
          )}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" /> Apto Físico Obligatorio</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={reglas.pideAptoFisico} onChange={e => setReglas({...reglas, pideAptoFisico: e.target.checked})} />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">El sistema le recordará subir su certificado médico anual.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}