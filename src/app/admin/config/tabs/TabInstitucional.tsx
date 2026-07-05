"use client"

import { Save, ExternalLink, UploadCloud, Loader2, Image as ImageIcon, Copy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabInstitucional({
  infoAcademia,
  setInfoAcademia,
  guardandoTextos,
  handleGuardarTextosInstitucionales,
  subiendoLogo,
  subiendoFirma,
  handleSubirImagen,
  copiarLinkRegistro,
  origenWeb
}: any) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card flex flex-col">
        <div className="px-6 py-5 border-b border-border bg-secondary/10 flex justify-between items-center">
          <h2 className="font-black text-foreground uppercase tracking-tight">Identidad y Accesos</h2>
          <Button onClick={handleGuardarTextosInstitucionales} disabled={guardandoTextos} size="sm" className="font-bold uppercase tracking-widest text-xs">
            {guardandoTextos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar Cambios
          </Button>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Legal Completo</label>
                <input type="text" value={infoAcademia.nombre_largo} onChange={e => setInfoAcademia({...infoAcademia, nombre_largo: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Corto (PDF)</label>
                  <input type="text" value={infoAcademia.nombre_corto} onChange={e => setInfoAcademia({...infoAcademia, nombre_corto: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Siglas (Ej: APP)</label>
                  <input type="text" value={infoAcademia.siglas} onChange={e => setInfoAcademia({...infoAcademia, siglas: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Identificador de Link (Slug)
                </label>
                <input 
                  type="text" 
                  value={infoAcademia.slug} 
                  onChange={e => setInfoAcademia({...infoAcademia, slug: e.target.value})} 
                  placeholder="ej: mi-club-barrio" 
                  className="w-full bg-primary/5 border border-primary/20 rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold text-primary" 
                />
                <p className="text-[10px] text-muted-foreground italic mt-1">Sin espacios ni mayúsculas. Este nombre aparecerá en tu link de registro.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Firma a nombre de:</label>
                <input type="text" value={infoAcademia.admin_nombre} onChange={e => setInfoAcademia({...infoAcademia, admin_nombre: e.target.value})} placeholder="Ej: Lic. Florencia Admin" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>

            <div className="space-y-6 md:border-l md:border-border md:pl-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Logo Oficial</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/20 shrink-0">
                    {subiendoLogo ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : infoAcademia.logo_url ? <img src={infoAcademia.logo_url} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground opacity-30" />}
                  </div>
                  <div>
                    <input type="file" id="upload-logo" className="hidden" accept="image/*" onChange={(e) => handleSubirImagen(e, 'logo')} />
                    <Button variant="outline" size="sm" disabled={subiendoLogo} onClick={() => document.getElementById('upload-logo')?.click()} className="font-bold text-xs h-8">
                      <UploadCloud className="h-3 w-3 mr-2" /> Cambiar Logo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border border-dashed">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Firma del Recibo</label>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/20 shrink-0 p-1">
                    {subiendoFirma ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : infoAcademia.firma_url ? <img src={infoAcademia.firma_url} className="h-full w-full object-contain mix-blend-multiply" /> : <p className="text-[8px] uppercase font-bold text-muted-foreground text-center">Sin Firma</p>}
                  </div>
                  <div>
                    <input type="file" id="upload-firma" className="hidden" accept="image/*" onChange={(e) => handleSubirImagen(e, 'firma')} />
                    <Button variant="outline" size="sm" disabled={subiendoFirma} onClick={() => document.getElementById('upload-firma')?.click()} className="font-bold text-xs h-8">
                      <UploadCloud className="h-3 w-3 mr-2" /> Subir Firma
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CAJA DEL ENLACE DE INVITACIÓN */}
          <div className="mt-8 p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-500 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Enlace Público de Registro
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                readOnly 
                value={infoAcademia.slug ? `${origenWeb}/registro?club=${infoAcademia.slug}` : "Guardá un Identificador (Slug) primero"} 
                className="w-full bg-white dark:bg-background border border-emerald-200 dark:border-emerald-800 rounded-xl h-11 px-4 text-sm font-medium text-emerald-900 dark:text-emerald-100 outline-none" 
              />
              <Button 
                onClick={copiarLinkRegistro} 
                disabled={!infoAcademia.slug}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shrink-0"
              >
                <Copy className="h-4 w-4 mr-2" /> Copiar Link
              </Button>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Compartí este enlace por WhatsApp o Instagram. Los alumnos que ingresen por acá quedarán registrados directamente en tu directorio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}