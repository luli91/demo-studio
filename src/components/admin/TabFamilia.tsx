"use client"

import { useState, useEffect } from "react"
import { UserPlus, Users, Calendar, Loader2, X, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

interface TabFamiliaProps {
  alumno: any
  onSubirArchivo: () => void
}

export default function TabFamilia({ alumno, onSubirArchivo }: TabFamiliaProps) {
  const supabase = createClient()
  const [hijos, setHijos] = useState<any[]>([])
  const [cargandoHijos, setCargandoHijos] = useState(true)
  const [agregandoHijo, setAgregandoHijo] = useState(false)
  const [mostrarFormMenor, setMostrarFormMenor] = useState(false)
  const [nuevoHijo, setNuevoHijo] = useState({ nombre: '', apellido: '', fecha_nacimiento: '' })

  const flex = alumno.datos_flexibles || {}

  useEffect(() => {
    const cargarFamiliares = async () => {
      if (alumno.id && !alumno.es_preinscripcion) {
        const { data } = await supabase.from('usuarios').select('*').eq('titular_id', alumno.id)
        if (data) setHijos(data)
      }
      setCargandoHijos(false)
    }
    cargarFamiliares()
  }, [alumno.id, alumno.es_preinscripcion, supabase])

  const handleAgregarHijo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (alumno.es_preinscripcion) return toast.error("La madre debe registrarse en la app primero.")
    
    setAgregandoHijo(true)
    try {
      const nombreCompleto = `${nuevoHijo.nombre} ${nuevoHijo.apellido}`.trim()
      const idMenor = crypto.randomUUID() 
      
      const { error } = await supabase.from('usuarios').insert({
        id: idMenor,
        nombre: nombreCompleto,
        email: null, 
        telefono: alumno.telefono || "", // Hereda el teléfono del tutor de forma automática
        rol: 'alumno',
        activa: true,
        titular_id: alumno.id, 
        datos_flexibles: {
          fecha_nacimiento: nuevoHijo.fecha_nacimiento,
          estado_cuota: 'vencida',
          creditos_clases: 0,
          contacto_urgencia: flex.contacto_urgencia || "" // Hereda el contacto de urgencia del tutor
        }
      })

      if (error) throw error

      toast.success(`¡${nombreCompleto} agregado al grupo familiar!`)
      setNuevoHijo({ nombre: '', apellido: '', fecha_nacimiento: '' })
      setMostrarFormMenor(false)
      
      const { data } = await supabase.from('usuarios').select('*').eq('titular_id', alumno.id)
      if (data) setHijos(data)
      
      onSubirArchivo() 
    } catch (error: any) {
      toast.error("Error al crear menor: " + error.message)
    } finally {
      setAgregandoHijo(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {!mostrarFormMenor && (
        <div className="flex justify-end">
          <Button onClick={() => setMostrarFormMenor(true)} className="rounded-xl h-11 font-bold uppercase tracking-widest text-xs shadow-md">
            <UserPlus className="h-4 w-4 mr-2" /> Agregar Menor
          </Button>
        </div>
      )}

      <div className={`grid grid-cols-1 ${mostrarFormMenor ? 'lg:grid-cols-3' : ''} gap-8`}>
        {mostrarFormMenor && (
          <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-4">
            <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
              <div className="p-5 border-b border-border bg-primary text-primary-foreground flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Vincular Menor</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMostrarFormMenor(false)} className="h-8 w-8 text-primary-foreground hover:bg-black/20 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleAgregarHijo} className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground mb-4">La cuota y el acceso estarán a cargo de {alumno.nombre}. El menor heredará la información de contacto.</p>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
                  <Input required value={nuevoHijo.nombre} onChange={e => setNuevoHijo({...nuevoHijo, nombre: e.target.value})} className="h-11 rounded-xl" placeholder="Ej: Mateo" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellido</label>
                  <Input required value={nuevoHijo.apellido} onChange={e => setNuevoHijo({...nuevoHijo, apellido: e.target.value})} className="h-11 rounded-xl" placeholder="Ej: Gómez" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input type="date" required value={nuevoHijo.fecha_nacimiento} onChange={e => setNuevoHijo({...nuevoHijo, fecha_nacimiento: e.target.value})} className="h-11 rounded-xl pl-10" />
                  </div>
                </div>
                <Button type="submit" disabled={agregandoHijo || alumno.es_preinscripcion} className="w-full h-11 font-bold uppercase tracking-widest text-xs mt-2 rounded-xl">
                  {agregandoHijo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Ficha Infantil"}
                </Button>
              </form>
            </Card>
          </div>
        )}

        <div className={`${mostrarFormMenor ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300`}>
          <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
            <div className="p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h3 className="font-black text-sm uppercase tracking-widest text-foreground">Menores a Cargo</h3></div>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-black">{hijos.length}</span>
            </div>
            <CardContent className="p-0">
              {cargandoHijos ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : hijos.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground text-xs italic">No hay menores vinculados a esta cuenta.</p>
              ) : (
                <div className="divide-y divide-border">
                  {hijos.map((hijo) => (
                    <div key={hijo.id} className="p-6 flex items-center justify-between hover:bg-secondary/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                          {hijo.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{hijo.nombre}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                            Nac: {hijo.datos_flexibles?.fecha_nacimiento ? format(new Date(hijo.datos_flexibles.fecha_nacimiento), "dd/MM/yyyy") : "Sin cargar"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Ficha Activa</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}