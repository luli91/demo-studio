"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { StickyNote, PlusCircle, CheckCircle2, Circle, Clock4, Trash2, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ETIQUETAS = [
  { id: "Administrativo", color: "bg-blue-100 text-blue-700" },
  { id: "Urgente", color: "bg-red-100 text-red-700" },
  { id: "Cumpleaños", color: "bg-fuchsia-100 text-fuchsia-700" },
  { id: "Cobro", color: "bg-emerald-100 text-emerald-700" },
  { id: "Personal", color: "bg-slate-100 text-slate-700" },
]

export default function AgendaDiaria({ tareas, setTareas, hoyStr }: { tareas: any[], setTareas: any, hoyStr: string }) {
  const supabase = createClient()
  const [modalTareaVisible, setModalTareaVisible] = useState(false)
  const [nuevaTarea, setNuevaTarea] = useState({ texto: "", fecha: hoyStr, etiqueta: "Administrativo" })
  const [modalPosponerVisible, setModalPosponerVisible] = useState(false)
  const [tareaIdPosponer, setTareaIdPosponer] = useState<string | null>(null)
  const [fechaPosponer, setFechaPosponer] = useState("")

  const handleAgregarTarea = async (e: React.FormEvent) => {
    e.preventDefault(); if (!nuevaTarea.texto.trim()) return
    setModalTareaVisible(false)
    const { data, error } = await supabase.from('tareas').insert([{ texto: nuevaTarea.texto, fecha: nuevaTarea.fecha, etiqueta: nuevaTarea.etiqueta, completada: false }]).select().single()
    if (!error && data) setTareas((prev: any) => [...prev, data])
    setNuevaTarea({ texto: "", fecha: hoyStr, etiqueta: "Administrativo" })
  }

  const toggleTarea = async (id: string) => {
    const tarea = tareas.find(t => t.id === id); if (!tarea) return
    const nuevoEstado = !tarea.completada
    setTareas(tareas.map(t => t.id === id ? { ...t, completada: nuevoEstado } : t))
    await supabase.from('tareas').update({ completada: nuevoEstado }).eq('id', id)
  }

  const eliminarTarea = async (id: string) => {
    setTareas(tareas.filter(t => t.id !== id))
    await supabase.from('tareas').delete().eq('id', id)
  }

  const iniciarPosponer = (id: string) => {
    setTareaIdPosponer(id); const mañana = new Date(); mañana.setDate(mañana.getDate() + 1)
    setFechaPosponer(`${mañana.getFullYear()}-${String(mañana.getMonth() + 1).padStart(2, '0')}-${String(mañana.getDate()).padStart(2, '0')}`)
    setModalPosponerVisible(true)
  }

  const confirmarPosponer = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tareaIdPosponer || !fechaPosponer) return
    setTareas(tareas.map(t => t.id === tareaIdPosponer ? { ...t, fecha: fechaPosponer } : t))
    setModalPosponerVisible(false); await supabase.from('tareas').update({ fecha: fechaPosponer }).eq('id', tareaIdPosponer)
  }

  const tareasVisibles = tareas
    .filter(t => t.fecha <= hoyStr || (t.completada && t.fecha === hoyStr))
    .sort((a, b) => {
      if (a.completada === b.completada) return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      return a.completada ? 1 : -1
    })

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-amber-50/30 rounded-t-xl">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-black text-slate-800">Mi Agenda Diaria</CardTitle>
          </div>
          <Button onClick={() => setModalTareaVisible(true)} size="sm" className="h-9 bg-slate-900 text-white font-bold"><PlusCircle className="h-4 w-4 mr-1.5" /> Agregar</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {tareasVisibles.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center"><CheckCircle2 className="h-10 w-10 text-emerald-200 mb-3" /><p className="text-slate-500 text-sm">¡Todo al día!</p></div>
            ) : (
              tareasVisibles.map((rec) => {
                const cE = ETIQUETAS.find(e => e.id === rec.etiqueta)?.color || "bg-slate-100 text-slate-700"
                const atrasada = rec.fecha < hoyStr && !rec.completada
                return (
                  <div key={rec.id} className={`p-4 px-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors ${rec.completada ? 'opacity-60' : ''}`}>
                    <div className="flex flex-1 items-center gap-3">
                      <button onClick={() => toggleTarea(rec.id)} className={rec.completada ? 'text-emerald-500' : 'text-slate-300'}>
                        {rec.completada ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                      </button>
                      <div>
                        <p className={`font-bold text-sm ${rec.completada ? 'line-through text-slate-500' : 'text-slate-800'}`}>{rec.texto}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${cE}`}>{rec.etiqueta}</span>
                          {atrasada && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atrasada ({rec.fecha.split('-').reverse().join('/')})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-9 sm:pl-0">
                      {!rec.completada && <Button onClick={() => iniciarPosponer(rec.id)} variant="outline" size="sm" className="h-8 text-[11px] font-bold text-amber-600 border-amber-200 gap-1.5"><Clock4 className="h-3.5 w-3.5" /> Posponer</Button>}
                      <Button onClick={() => eliminarTarea(rec.id)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODALES DE TAREAS */}
      {modalTareaVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><StickyNote className="h-5 w-5 text-primary" /> Nueva Tarea</h3>
            <form onSubmit={handleAgregarTarea} className="space-y-4">
              <input type="text" autoFocus required placeholder="¿Qué tenés que hacer?" value={nuevaTarea.texto} onChange={(e) => setNuevaTarea({...nuevaTarea, texto: e.target.value})} className="w-full border border-slate-200 rounded-xl h-12 px-4 text-sm font-medium" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={nuevaTarea.fecha} onChange={(e) => setNuevaTarea({...nuevaTarea, fecha: e.target.value})} className="w-full border border-slate-200 rounded-xl h-11 px-3 text-sm font-medium" />
                <select value={nuevaTarea.etiqueta} onChange={(e) => setNuevaTarea({...nuevaTarea, etiqueta: e.target.value})} className="w-full border border-slate-200 rounded-xl h-11 px-3 text-sm font-medium">
                  {ETIQUETAS.map(etq => <option key={etq.id} value={etq.id}>{etq.id}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setModalTareaVisible(false)} variant="outline" className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 bg-slate-900 text-white">Guardar</Button></div>
            </form>
          </div>
        </div>
      )}

      {modalPosponerVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Clock4 className="h-5 w-5 text-amber-600" /> Posponer</h3>
            <form onSubmit={confirmarPosponer} className="space-y-4">
              <input type="date" autoFocus required min={hoyStr} value={fechaPosponer} onChange={(e) => setFechaPosponer(e.target.value)} className="w-full border border-slate-200 rounded-xl h-12 px-4" />
              <div className="flex gap-3"><Button type="button" onClick={() => setModalPosponerVisible(false)} variant="outline" className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 bg-amber-500 text-white">Confirmar</Button></div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}