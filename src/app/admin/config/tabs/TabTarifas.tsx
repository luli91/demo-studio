import { Plus, CreditCard, Pencil, Loader2, Trash2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TabTarifas({
  tarifas,
  esMensual,
  abrirModalNueva,
  abrirModalEditar,
  modalTarifa,
  setModalTarifa,
  tarifaEditando,
  setTarifaEditando,
  guardarTarifa,
  borrarTarifa,
  guardandoTarifa
}: any) {
  return (
    <>
      <div className="animate-in slide-in-from-bottom-2">
        <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card">
          <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/10">
            <h2 className="font-black text-foreground uppercase tracking-tight">Catálogo de Pases</h2>
            <Button onClick={abrirModalNueva} size="sm" className="font-bold">
              <Plus className="h-4 w-4 mr-1" /> Nueva Tarifa
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tarifas.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm italic">Aún no configuraste ninguna tarifa en el sistema.</p>
                  <Button onClick={abrirModalNueva} variant="link" className="mt-2 font-bold text-primary">Crear mi primera tarifa</Button>
                </div>
              ) : (
                tarifas.map((tarifa: any) => (
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
                        <p className="text-2xl font-black text-emerald-600">${Number(tarifa.precio).toLocaleString('es-AR')}</p>
                      </div>
                      <Button onClick={() => abrirModalEditar(tarifa)} variant="outline" size="icon" className="border-border hover:bg-secondary text-foreground shrink-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {modalTarifa && tarifaEditando && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 flex justify-between items-center border-b border-border bg-secondary/10">
              <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {tarifaEditando.id ? 'Editar Tarifa' : 'Nueva Tarifa'}
              </h3>
              <button onClick={() => setModalTarifa(false)} className="hover:bg-secondary p-1 rounded-full"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={guardarTarifa} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nombre del Pase / Cuota</label>
                <input required placeholder="Ej: Cuota Individual" value={tarifaEditando.nombre} onChange={e => setTarifaEditando({...tarifaEditando, nombre: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Precio en pesos ($)</label>
                <input type="number" required placeholder="Ej: 15000" value={tarifaEditando.precio} onChange={e => setTarifaEditando({...tarifaEditando, precio: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 text-lg font-bold focus:border-primary outline-none" />
              </div>

              {!esMensual && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Créditos</label>
                  <input type="number" required value={tarifaEditando.creditos} onChange={e => setTarifaEditando({...tarifaEditando, creditos: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 font-bold focus:border-primary outline-none" />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                {tarifaEditando.id && (
                  <Button type="button" variant="outline" onClick={borrarTarifa} disabled={guardandoTarifa} className="border-destructive text-destructive hover:bg-destructive hover:text-white px-4 h-12 rounded-xl">
                    {guardandoTarifa ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  </Button>
                )}
                <Button type="submit" disabled={guardandoTarifa} className="flex-1 font-black uppercase tracking-widest h-12 rounded-xl">
                  {guardandoTarifa ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Tarifa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}