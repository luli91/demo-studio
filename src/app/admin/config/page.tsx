"use client"

import { useState } from "react"
import { Settings, CreditCard, Clock, Plus, Pencil, Trash2, Save, X, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ConfiguracionAdminPage() {
  const modeloNegocio = "mensual" // Cambialo para probar los distintos textos
  const esMensual = modeloNegocio === "mensual"

  // Catálogo de Tarifas Simulado (Esto viene de la tabla 'pases')
  const [tarifas, setTarifas] = useState([
    { id: 1, nombre: "Cuota Individual", precio: 15000, tipo: "mensual", creditos: null },
    { id: 2, nombre: "Cuota Grupo Familiar (2 Hnos)", precio: 25000, tipo: "mensual", creditos: null },
    { id: 3, nombre: "Pack 4 Clases", precio: 8500, tipo: "creditos", creditos: 4 },
    { id: 4, nombre: "Clase Suelta", precio: 3000, tipo: "creditos", creditos: 1 },
  ])

  // Reglas del estudio simuladas (Tabla 'academias')
  const [reglas, setReglas] = useState({
    horasCancelacion: 5,
    pideAptoFisico: true,
  })

  const [modalTarifa, setModalTarifa] = useState(false)
  const [tarifaEditando, setTarifaEditando] = useState<any>(null)

  const abrirModalNueva = () => {
    setTarifaEditando({ nombre: "", precio: "", tipo: esMensual ? "mensual" : "creditos", creditos: "" })
    setModalTarifa(true)
  }

  const abrirModalEditar = (tarifa: any) => {
    setTarifaEditando(tarifa)
    setModalTarifa(true)
  }

  const guardarTarifa = (e: React.FormEvent) => {
    e.preventDefault()
    // Acá iría el UPDATE o INSERT en Supabase (tabla 'pases')
    if (tarifaEditando.id) {
      setTarifas(tarifas.map(t => t.id === tarifaEditando.id ? { ...tarifaEditando, precio: Number(tarifaEditando.precio) } : t))
    } else {
      setTarifas([...tarifas, { ...tarifaEditando, id: Date.now(), precio: Number(tarifaEditando.precio) }])
    }
    setModalTarifa(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic">Configuración Global</h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestión de tarifas, pases y reglas operativas del sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Catálogo de Precios */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/10">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground uppercase tracking-tight">Catálogo de Tarifas</h2>
              </div>
              <Button onClick={abrirModalNueva} size="sm" className="font-bold">
                <Plus className="h-4 w-4 mr-1" /> Nueva Tarifa
              </Button>
            </div>
            
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {tarifas.filter(t => esMensual ? t.tipo === "mensual" : t.tipo === "creditos").map(tarifa => (
                  <div key={tarifa.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                    <div>
                      <h3 className="font-black text-lg uppercase text-foreground">{tarifa.nombre}</h3>
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        {tarifa.tipo === 'mensual' ? 'Renovación automática cada mes' : `Otorga ${tarifa.creditos} créditos para reservas`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Precio Final</p>
                        <p className="text-2xl font-black text-emerald-600">${tarifa.precio.toLocaleString('es-AR')}</p>
                      </div>
                      <Button onClick={() => abrirModalEditar(tarifa)} variant="outline" size="icon" className="border-border hover:bg-secondary text-foreground">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Reglas de Negocio */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
            <div className="px-6 py-5 border-b border-border flex items-center gap-2 bg-secondary/10">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground uppercase tracking-tight">Reglas del Estudio</h2>
            </div>
            
            <CardContent className="p-6 space-y-6">
              
              {!esMensual && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Límite de Cancelación
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={reglas.horasCancelacion} 
                      onChange={e => setReglas({...reglas, horasCancelacion: Number(e.target.value)})}
                      className="w-20 bg-background border border-border rounded-xl h-10 px-3 text-center font-bold outline-none focus:border-primary"
                    />
                    <span className="text-sm text-muted-foreground font-medium">horas de anticipación</span>
                  </div>
                  <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">
                    Si la alumna cancela con menos horas de anticipación, el sistema <strong>no le devuelve el crédito</strong>.
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" /> Apto Físico Obligatorio
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={reglas.pideAptoFisico} onChange={e => setReglas({...reglas, pideAptoFisico: e.target.checked})} />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">
                  Si está activado, el sistema le recordará constantemente al alumno en su panel que debe subir el certificado médico anual.
                </p>
              </div>

              <Button className="w-full font-bold uppercase tracking-widest h-11 mt-4">
                <Save className="h-4 w-4 mr-2" /> Guardar Reglas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL TARIFA */}
      {modalTarifa && tarifaEditando && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-border bg-secondary/10">
              <h3 className="font-black text-lg uppercase tracking-tight">{tarifaEditando.id ? 'Editar Tarifa' : 'Nueva Tarifa'}</h3>
              <button onClick={() => setModalTarifa(false)} className="hover:bg-secondary p-1 rounded-full"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={guardarTarifa} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nombre del Pase / Cuota</label>
                <input 
                  required value={tarifaEditando.nombre} 
                  onChange={e => setTarifaEditando({...tarifaEditando, nombre: e.target.value})} 
                  placeholder="Ej: Cuota Familiar (2 Hnos)"
                  className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Precio en pesos ($)</label>
                <input 
                  type="number" required value={tarifaEditando.precio} 
                  onChange={e => setTarifaEditando({...tarifaEditando, precio: e.target.value})} 
                  className="w-full bg-background border border-border rounded-xl h-12 px-4 text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>

              {!esMensual && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Créditos (Clases que otorga)</label>
                  <input 
                    type="number" required value={tarifaEditando.creditos} 
                    onChange={e => setTarifaEditando({...tarifaEditando, creditos: e.target.value})} 
                    className="w-full bg-background border border-border rounded-xl h-12 px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                {tarifaEditando.id && (
                  <Button type="button" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white px-3">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
                <Button type="submit" className="flex-1 font-bold uppercase tracking-widest h-12">
                  Guardar Tarifa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}