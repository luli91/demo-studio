import { UploadCloud, Loader2, Save, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabInicio({ general, setGeneral, handleGuardarGeneral, guardandoGeneral, handleSubirPortada, subiendoArchivo }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-secondary/10 flex items-center justify-between">
          <h3 className="font-black uppercase tracking-tight text-lg">Portada y Textos</h3>
          <Button onClick={handleGuardarGeneral} disabled={guardandoGeneral} size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            {guardandoGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar
          </Button>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frase Inspiracional</label>
            <textarea value={general.hero_frase} onChange={e => setGeneral({...general, hero_frase: e.target.value})} placeholder="Ej: Entrená, superate y conectá..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-primary min-h-[80px] resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Foto de Portada</label>
            <div className="w-full h-40 bg-secondary/20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative group">
              {general.hero_portada ? (
                <>
                  <img src={general.hero_portada} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={() => document.getElementById('upload-portada')?.click()}><UploadCloud className="h-4 w-4 mr-2" /> Cambiar Portada</Button>
                  </div>
                </>
              ) : (
                <Button variant="outline" onClick={() => document.getElementById('upload-portada')?.click()}><UploadCloud className="h-4 w-4 mr-2" /> Subir Imagen</Button>
              )}
              <input type="file" id="upload-portada" className="hidden" accept="image/*" onChange={handleSubirPortada} />
            </div>
            {subiendoArchivo === "portada" && <p className="text-xs text-primary font-bold animate-pulse mt-1">Cargando imagen al servidor...</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card h-fit">
        <div className="px-6 py-5 border-b border-border bg-emerald-500/10 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          <h2 className="font-black text-emerald-700 uppercase tracking-tight">Ubicación y Contacto</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dirección Física (Sección Contacto)</label>
            <input type="text" placeholder="Ej: Av. Rivadavia 1234, CABA" value={general.direccion} onChange={e => setGeneral({...general, direccion: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 font-medium outline-none focus:border-emerald-500" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp (Sin el signo +)</label>
            <input type="text" placeholder="Ej: 5491122334455" value={general.whatsapp} onChange={e => setGeneral({...general, whatsapp: e.target.value.replace(/\D/g, '')})} className="w-full bg-background border border-border rounded-xl h-12 px-4 font-bold outline-none focus:border-emerald-500" />
          </div>
          <Button onClick={handleGuardarGeneral} disabled={guardandoGeneral} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-12">
            Actualizar Contacto
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}