"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Users, Phone, AlertCircle, CheckCircle2, ShieldAlert, Megaphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ProfesorDashboardPage() {
  const supabase = createClient()
  
  const [isMounted, setIsMounted] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  const [misAlumnos, setMisAlumnos] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [alumnaExpandida, setAlumnaExpandida] = useState<string | null>(null)

  const hoy = new Date()

  useEffect(() => {
    setIsMounted(true)
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfilOficial } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      if (perfilOficial) {
        setPerfil(perfilOficial)
        
        // --- TRAER CARTELERA DE AVISOS DE LA ACADEMIA ---
        if (perfilOficial.academia_id) {
          const { data: academia } = await supabase
            .from('academias')
            .select('eventos_cartelera')
            .eq('id', perfilOficial.academia_id)
            .single()

          if (academia) {
            const listaAvisos = typeof academia.eventos_cartelera === 'string'
              ? JSON.parse(academia.eventos_cartelera)
              : (academia.eventos_cartelera || [])
            setEventos(listaAvisos)
          }
        }
      }

      // 1. Qué grupos (etiquetas) enseña este profe?
      let flexProfe: any = {}
      try { flexProfe = typeof perfilOficial?.datos_flexibles === 'string' ? JSON.parse(perfilOficial.datos_flexibles) : (perfilOficial?.datos_flexibles || {}) } catch(e){}
      const etiquetasAsignadas = flexProfe.etiquetas_asignadas || []

      // 2. Traer alumnos activos
      const { data: alumnosData } = await supabase.from('usuarios').select('*').eq('rol', 'alumno').eq('activa', true)
      
      // 3. Cruzar datos: Filtrar a los alumnos que tengan alguna de las etiquetas del profe
      if (alumnosData && etiquetasAsignadas.length > 0) {
        const alumnosFiltrados = alumnosData.filter(a => {
          let flexAlu: any = {}
          try { flexAlu = typeof a.datos_flexibles === 'string' ? JSON.parse(a.datos_flexibles) : (a.datos_flexibles || {}) } catch(e){}
          const tagsAlumno = flexAlu.etiquetas || []
          // Retorna true si el alumno tiene al menos 1 etiqueta que el profe enseña
          return tagsAlumno.some((t: string) => etiquetasAsignadas.includes(t))
        })
        setMisAlumnos(alumnosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }
      
      setCargando(false)
    }
    cargarDatos()
  }, [supabase])

  if (!isMounted) return null
  if (cargando) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  const etiquetasAsignadas = perfil?.datos_flexibles?.etiquetas_asignadas || []
  const avatarUrl = perfil?.datos_flexibles?.avatar_url

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-12 text-foreground">
      
      {/* HEADER DE BIENVENIDA (AHORA CON FOTO) */}
      <div className="bg-primary/10 text-primary p-6 rounded-[2rem] border border-primary/20 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-primary">{perfil?.nombre?.charAt(0) || "P"}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none">
              ¡Hola, {perfil?.nombre ? perfil.nombre.split(" ")[0] : "Profesor"}!
            </h1>
            <p className="text-sm font-medium opacity-80 mt-1">
              Panel oficial de seguimiento deportivo.
            </p>
          </div>
        </div>
        <div className="bg-background/50 backdrop-blur-sm px-4 py-3 rounded-xl text-center md:text-right border border-primary/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Fecha Actual</p>
          <p className="font-bold text-sm">{format(hoy, 'EEEE dd/MM', { locale: es })}</p>
        </div>
      </div>

      {/* CARTELERA DE ANUNCIOS INSTITUCIONALES */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" /> Cartelera de Avisos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventos.length === 0 ? (
            <Card className="col-span-1 md:col-span-2 bg-card border-2 border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground italic text-xs font-bold uppercase tracking-widest">
              No hay avisos recientes publicados por la administración.
            </Card>
          ) : (
            eventos.map((aviso: any) => (
              <Card key={aviso.id} className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden flex flex-col justify-between">
                <div>
                  {aviso.imagen_url && (
                    <div className="w-full h-36 bg-secondary/20 border-b border-border">
                      <img src={aviso.imagen_url} alt="Aviso" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="text-sm uppercase font-black tracking-tight">{aviso.titulo}</h4>
                    <p className="font-medium text-xs whitespace-pre-wrap mt-1 text-foreground/80 leading-relaxed">
                      {aviso.descripcion}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-2 border-t border-border/20 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Publicado el {new Date(aviso.fecha).toLocaleDateString('es-AR')}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* GRUPOS A CARGO */}
      <div className="pt-2">
        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Tus Grupos a Cargo
        </h2>
        {etiquetasAsignadas.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center shadow-sm">
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs italic">
              La administración no te ha asignado categorías todavía.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {etiquetasAsignadas.map((tag: string) => (
              <div key={tag} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm">
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LISTADO DE ALUMNOS (SOLO LECTURA) */}
      {etiquetasAsignadas.length > 0 && (
        <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card mt-8">
          <div className="p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Fichas Médicas & Roster ({misAlumnos.length})
            </h3>
          </div>
          <CardContent className="p-0">
            {misAlumnos.length === 0 ? (
              <p className="text-center text-muted-foreground italic py-8 text-sm">No hay alumnos inscriptos en tus categorías.</p>
            ) : (
              <ul className="divide-y divide-border">
                {misAlumnos.map((alumno) => {
                  const flex = alumno.datos_flexibles || {}
                  const expandida = alumnaExpandida === alumno.id

                  return (
                    <li key={alumno.id} className="flex flex-col transition-colors hover:bg-secondary/5">
                      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setAlumnaExpandida(expandida ? null : alumno.id)}>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                            {alumno.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground uppercase tracking-tight">{alumno.nombre}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(flex.etiquetas || []).filter((t:string) => etiquetasAsignadas.includes(t)).map((t:string) => (
                                <span key={t} className="text-[8px] bg-secondary border border-border px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-muted-foreground underline decoration-dashed opacity-50 hover:opacity-100 transition-opacity">
                            {expandida ? 'Ocultar' : 'Ver Ficha'}
                          </span>
                        </div>
                      </div>

                      {expandida && (
                        <div className="px-5 pb-5 pt-2 bg-background/50 border-t border-border/30 space-y-4 animate-in slide-in-from-top-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp Contacto</p>
                              <p className="font-bold text-foreground text-sm">{alumno.telefono || "No especificado"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Estado Administrativo</p>
                              <p className={`font-bold text-sm flex items-center gap-1.5 ${flex.estado_cuota === 'al_dia' ? 'text-emerald-500' : 'text-destructive'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${flex.estado_cuota === 'al_dia' ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                                {flex.estado_cuota === 'al_dia' ? 'Apta para entrenar' : 'Regularizar Deuda en Adm.'}
                              </p>
                            </div>
                          </div>
                          <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20 shadow-inner">
                            <p className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-2 mb-1">
                              <AlertCircle className="h-3.5 w-3.5 animate-pulse" /> Ficha Médica / Urgencias
                            </p>
                            <p className="font-black text-destructive dark:text-red-400 text-sm uppercase">
                              {flex.contacto_urgencia || "⚠️ SIN CONTACTO DE EMERGENCIA DECLARADO"}
                            </p>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}