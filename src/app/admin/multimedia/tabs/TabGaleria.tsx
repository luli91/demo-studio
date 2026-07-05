"use client"

import { UploadCloud, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabGaleria({ galeria, subiendoArchivo, handleAgregarFotoGaleria, handleEliminarFotoGaleria }: any) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] bg-card border-dashed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <input type="file" id="upload-galeria-real" className="hidden" accept="image/*" onChange={handleAgregarFotoGaleria} disabled={subiendoArchivo === "galeria"} />
          <Button onClick={() => document.getElementById('upload-galeria-real')?.click()} disabled={subiendoArchivo === "galeria"} className="font-black uppercase tracking-widest h-12 px-8">
            {subiendoArchivo === "galeria" ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5 mr-2" />} Cargar Foto del Estudio
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {galeria.map((foto: any) => (
          <div key={foto.id} className="relative rounded-2xl overflow-hidden group aspect-square bg-muted border border-border">
            <img src={foto.url} className="w-full h-full object-cover" alt="Estudio" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" onClick={() => handleEliminarFotoGaleria(foto.id, foto.url)} className="rounded-full"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}