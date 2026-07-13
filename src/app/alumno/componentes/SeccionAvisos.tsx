"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Megaphone } from "lucide-react"

export default function SeccionAvisos({ avisosCartelera }: any) {
  return (
    <div className="space-y-4 mt-12">
      <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <Megaphone className="h-4 w-4" /> Avisos de la Institución
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {avisosCartelera.length === 0 ? (
          <Card className="col-span-1 md:col-span-2 bg-card border border-border rounded-[2rem] p-8 text-center text-muted-foreground italic text-sm">
            No hay avisos recientes publicados por la academia.
          </Card>
        ) : (
          avisosCartelera.map((aviso: any) => (
            <Card key={aviso.id} className="bg-card border border-border shadow-md rounded-[2rem] overflow-hidden flex flex-col justify-between">
              <div>
                {aviso.imagen_url && (
                  <div className="w-full h-48 sm:h-64 bg-secondary/20 border-b border-border">
                    <img src={aviso.imagen_url} alt="Aviso" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="p-6">
                  <CardTitle className="text-lg sm:text-xl uppercase font-black tracking-tight">{aviso.titulo}</CardTitle>
                  <CardDescription className="font-medium text-xs sm:text-sm whitespace-pre-wrap mt-2 text-foreground/80 leading-relaxed">
                    {aviso.descripcion}
                  </CardDescription>
                </CardHeader>
              </div>
              <div className="px-6 pb-4 pt-2 border-t border-border/20 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Publicado el {new Date(aviso.fecha).toLocaleDateString('es-AR')}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}