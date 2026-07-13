"use client"

import { Save, ExternalLink, UploadCloud, Loader2, Image as ImageIcon, Copy, Phone, LogIn, UserPlus } from "lucide-react"
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
  copiarLinkLogin, 
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
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> WhatsApp de Administración
                </label>
                <input 
                  type="text" 
                  value={infoAcademia.telefono || ""} 
                  onChange={e => setInfoAcademia({...infoAcademia, telefono: e.target.value})} 
                  placeholder="Ej: 5491100000000" 
                  className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" 
                />
                <p className="text-[10px] text-muted-foreground italic mt-1">Con código de país y sin el símbolo +. Ej: 5491122334455</p>
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
                <p className="text-[10px] text-muted-foreground italic mt-1">Sin espacios ni mayúsculas. Este nombre aparecerá en tus links.</p>
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
                    {subiendoFirma ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : infoAcademia.firma_url && infoAcademia.firma_url.trim() !== "" && infoAcademia.firma_url !== "null" ? (
                      <img src={infoAcademia.firma_url} className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <p className="text-[8px] uppercase font-bold text-muted-foreground text-center">Fondo<br/>Blanco</p>
                    )}
                  </div>
                  <div>
                    <input type="file" id="upload-firma" className="hidden" accept="image/*" onChange={(e) => handleSubirImagen(e, 'firma')} />
                    <Button variant="outline" size="sm" disabled={subiendoFirma} onClick={() => document.getElementById('upload-firma')?.click()} className="font-bold text-xs h-8">
                      <UploadCloud className="h-3 w-3 mr-2" /> Subir Firma
                    </Button>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1">Recomendado: Imagen PNG o JPG con fondo blanco.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-blue-200 dark:border-blue-800/50 pb-4">
              <ExternalLink className="h-5 w-5 text-blue-700 dark:text-blue-500" />
              <h3 className="font-black uppercase tracking-widest text-sm text-blue-900 dark:text-blue-400">Enlaces Oficiales de tu Academia</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-800/70 dark:text-blue-500 flex items-center gap-1.5">
                <UserPlus className="h-3 w-3" /> Link para Alumnos Nuevos (Registro)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  readOnly 
                  value={infoAcademia.slug ? `${origenWeb}/registro?club=${infoAcademia.slug}` : "Guardá un Identificador (Slug) primero"} 
                  className="w-full bg-white dark:bg-background border-2 border-blue-300 dark:border-blue-800 rounded-xl h-11 px-4 text-sm font-black text-blue-800 dark:text-blue-300 outline-none shadow-sm" 
                />
                <Button 
                  onClick={copiarLinkRegistro} 
                  disabled={!infoAcademia.slug}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shrink-0 shadow-sm"
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-800/70 dark:text-blue-500 flex items-center gap-1.5">
                <LogIn className="h-3 w-3" /> Link para Alumnos Registrados (Login)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  readOnly 
                  value={infoAcademia.slug ? `${origenWeb}/login?club=${infoAcademia.slug}` : "Guardá un Identificador (Slug) primero"} 
                  className="w-full bg-white dark:bg-background border-2 border-blue-300 dark:border-blue-800 rounded-xl h-11 px-4 text-sm font-black text-blue-800 dark:text-blue-300 outline-none shadow-sm" 
                />
                <Button 
                  onClick={copiarLinkLogin} 
                  disabled={!infoAcademia.slug}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shrink-0 shadow-sm"
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
              </div>
            </div>

            <p className="text-xs text-blue-800 dark:text-blue-400 font-medium pt-2">
              Compartí estos enlaces por WhatsApp o en la biografía de tu Instagram. Son la puerta de entrada a tu sistema.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}