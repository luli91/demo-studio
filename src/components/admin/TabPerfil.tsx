"use client"

import { Camera, Phone, MapPin, ShieldAlert, AlertCircle, Trash2, UserX, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface TabPerfilProps {
  alumno: any
  esTutor: boolean
  direccionArmada: string
  subiendoFoto: boolean
  onCambiarFoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEliminarPre: () => void
  onArchivar: () => void
}

export default function TabPerfil({ 
  alumno, esTutor, direccionArmada, subiendoFoto, onCambiarFoto, onEliminarPre, onArchivar 
}: TabPerfilProps) {
  
  const flex = alumno.datos_flexibles || {}

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* TARJETA DE PERFIL Y DATOS PERSONALES */}
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm text-center relative">
        
        {esTutor && (
          <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Cuenta Tutora
          </span>
        )}

        {/* SECCIÓN FOTO DE PERFIL */}
        <div className="relative mx-auto w-28 h-28 mb-4 mt-4 group cursor-pointer">
          <div className="h-full w-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-5xl font-black overflow-hidden border-4 border-background shadow-sm">
            {subiendoFoto ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : flex.avatar_url ? (
              <img src={flex.avatar_url} className="h-full w-full object-cover" />
            ) : (
              `${alumno.nombre.charAt(0)}`
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-secondary p-2 rounded-full border-2 border-background cursor-pointer hover:bg-primary hover:text-white transition-colors">
            <Camera className="h-4 w-4" />
            <input type="file" className="hidden" accept="image/*" onChange={onCambiarFoto} disabled={subiendoFoto} />
          </label>
        </div>

        <h2 className="text-2xl font-black leading-none">{alumno.nombre} {alumno.apellido}</h2>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">{alumno.email || "Cuenta de Menor"}</p>
        
        <div className="mt-8 space-y-4 text-left p-6 bg-secondary/10 rounded-3xl border border-border">
          {flex.fecha_nacimiento && (
            <div className="flex items-center gap-3 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Nacimiento: {format(new Date(flex.fecha_nacimiento), "dd/MM/yyyy")}
            </div>
          )}
          <div className="flex items-center gap-3 text-sm font-medium"><Phone className="h-4 w-4 text-muted-foreground" /> {alumno.telefono || "Sin teléfono"}</div>
          <div className="flex items-center gap-3 text-sm font-medium items-start"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> {direccionArmada || "Sin dirección"}</div>
        </div>

        <div className={`mt-6 p-4 rounded-2xl border-2 shadow-inner text-left ${flex.contacto_urgencia ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${flex.contacto_urgencia ? 'text-destructive' : 'text-amber-600'}`}>
            {flex.contacto_urgencia ? <ShieldAlert className="h-4 w-4 animate-pulse" /> : <AlertCircle className="h-4 w-4" />} Contacto Emergencia
          </p>
          <p className={`font-black text-sm uppercase mt-1 ${flex.contacto_urgencia ? 'text-foreground' : 'text-amber-700'}`}>
            {flex.contacto_urgencia || "⚠️ NO CARGADO"}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acciones de Cuenta</p>
          {alumno.es_preinscripcion ? (
            <Button variant="ghost" onClick={() => { if(confirm("¿Eliminar?")) onEliminarPre() }} className="w-full text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest h-11 rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar de Sala de Espera
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => { if(confirm("¿Archivar alumna?")) onArchivar() }} className="w-full text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest h-11 rounded-xl">
              <UserX className="h-4 w-4 mr-2" /> Archivar / Dar de Baja
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}