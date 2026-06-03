"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Save, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Tu diccionario de zonas intacto
const ZONAS: Record<string, string[]> = {
  "CABA": ["Agronomía", "Almagro", "Balvanera", "Belgrano", "Caballito", "Flores", "Palermo", "Recoleta", "Villa Urquiza"],
  "GBA Norte": ["Pilar", "San Isidro", "San Martín", "Tigre", "Vicente López"],
  "GBA Sur": ["Avellaneda", "Berazategui", "Lanús", "Lomas de Zamora", "Quilmes"],
  "GBA Oeste": ["Hurlingham", "Ituzaingó", "La Matanza", "Merlo", "Moreno", "Morón", "Tres de Febrero"]
};

export default function PerfilProfe() {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  
  const [datosEdit, setDatosEdit] = useState({ 
    nombre: "", apellido: "", telefono: "", contacto_urgencia: "", calle: "", numero_calle: "", provincia: "", barrio_localidad: "" 
  })

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
        if (data) {
          setPerfil(data)
          setDatosEdit({
            nombre: data.nombre || "", apellido: data.apellido || "", telefono: data.telefono || "", 
            contacto_urgencia: data.contacto_urgencia || "", calle: data.calle || "", numero_calle: data.numero_calle || "", 
            provincia: data.provincia || "", barrio_localidad: data.barrio_localidad || ""
          })
        }
      }
      setCargando(false)
    }
    cargar()
  }, [])

  const handleUpdate = async () => {
    setGuardando(true)
    const nombreArmado = `${datosEdit.nombre} ${datosEdit.apellido}`.trim()
    const { error } = await supabase.from("perfiles").update({
      ...datosEdit, nombre_completo: nombreArmado
    }).eq("id", perfil.id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      toast.success("¡Perfil actualizado correctamente!")
    }
    setGuardando(false)
  }

  if (cargando) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in">
      
      {/* Encabezado */}
      <div className="flex items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="p-3 bg-primary/10 rounded-xl">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Mi Perfil</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Actualizá tus datos personales y contacto de emergencia.</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
            <input 
              value={datosEdit.nombre} 
              onChange={e => setDatosEdit({...datosEdit, nombre: e.target.value})} 
              className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="Ej: Laura"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellido</label>
            <input 
              value={datosEdit.apellido} 
              onChange={e => setDatosEdit({...datosEdit, apellido: e.target.value})} 
              className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="Ej: Gómez"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Teléfono / WhatsApp</label>
            <input 
              value={datosEdit.telefono} 
              onChange={e => setDatosEdit({...datosEdit, telefono: e.target.value})} 
              className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="Ej: 11 1234-5678"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-destructive uppercase tracking-widest ml-1 flex items-center gap-1">
              Contacto de Emergencia
            </label>
            <input 
              value={datosEdit.contacto_urgencia} 
              onChange={e => setDatosEdit({...datosEdit, contacto_urgencia: e.target.value})} 
              className="w-full bg-destructive/5 border border-destructive/20 rounded-xl h-12 px-4 focus:border-destructive focus:ring-1 focus:ring-destructive outline-none transition-all placeholder:text-destructive/40" 
              placeholder="Nombre y celular" 
            />
          </div>
        </div>

        {/* Sección de Domicilio Inteligente */}
        <div className="p-6 bg-secondary/30 rounded-2xl border border-border space-y-5">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Domicilio
          </label>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <input 
                value={datosEdit.calle} 
                onChange={e => setDatosEdit({...datosEdit, calle: e.target.value})} 
                placeholder="Nombre de la calle" 
                className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              />
            </div>
            <div className="col-span-1">
              <input 
                value={datosEdit.numero_calle} 
                onChange={e => setDatosEdit({...datosEdit, numero_calle: e.target.value})} 
                placeholder="Altura" 
                className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select 
              value={datosEdit.provincia} 
              onChange={e => setDatosEdit({...datosEdit, provincia: e.target.value, barrio_localidad: ""})} 
              className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
            >
              <option value="" disabled>Seleccioná Provincia...</option>
              <option value="CABA">Capital Federal (CABA)</option>
              <option value="GBA Norte">GBA Zona Norte</option>
              <option value="GBA Sur">GBA Zona Sur</option>
              <option value="GBA Oeste">GBA Zona Oeste</option>
            </select>
            
            {ZONAS[datosEdit.provincia] ? (
              <select 
                value={datosEdit.barrio_localidad} 
                onChange={e => setDatosEdit({...datosEdit, barrio_localidad: e.target.value})} 
                className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
              >
                <option value="" disabled>Seleccioná Zona/Barrio...</option>
                {ZONAS[datosEdit.provincia].map(barrio => (
                  <option key={barrio} value={barrio}>{barrio}</option>
                ))}
              </select>
            ) : (
              <input 
                value={datosEdit.barrio_localidad} 
                onChange={e => setDatosEdit({...datosEdit, barrio_localidad: e.target.value})} 
                placeholder="Barrio o Localidad" 
                disabled={!datosEdit.provincia} 
                className="w-full bg-background border border-border rounded-xl h-12 px-4 outline-none opacity-50 cursor-not-allowed" 
              />
            )}
          </div>
        </div>

        <Button 
          onClick={handleUpdate} 
          disabled={guardando} 
          className="w-full h-14 font-black uppercase tracking-widest rounded-xl text-md mt-4"
        >
          {guardando ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" /> Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}