import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventosProps {
  eventos: any[];
  whatsapp: string;
}

export default function Eventos({ eventos, whatsapp }: EventosProps) {
  if (!eventos || eventos.length === 0) return null;

  return (
    <section id="eventos" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black uppercase italic">Próximos Eventos</h2>
      </div>
      
      <div className="space-y-10">
        {eventos.map(ev => {
          const precioReal = ev.precio || ev.precio_evento || 0;
          const esEventoPago = ev.costo_creditos === 0 && precioReal > 0;

          return (
            <div key={ev.id} className="relative bg-slate-900 text-white flex flex-col md:flex-row group overflow-hidden">
              <div className="md:w-1/2 h-72 md:h-auto overflow-hidden bg-slate-800 flex items-center justify-center">
                {ev.imagen_url ? (
                  <img src={ev.imagen_url} alt={ev.nivel} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0" />
                ) : (
                  <Calendar className="w-20 h-20 text-white/10" />
                )}
              </div>
              <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center space-y-6">
                <h3 className="text-4xl font-black uppercase">{ev.nivel}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{ev.descripcion_evento || "Evento especial del estudio."}</p>
                
                <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-6">
                  <div>
                    <p className="text-5xl font-black tracking-tighter">
                      {esEventoPago ? `$${precioReal}` : "1 Crédito"}
                    </p>
                    <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-2">
                      Fecha: {ev.fecha.split('-').reverse().join('/')} a las {ev.horario.slice(0,5)}hs
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const msj = `Hola! Quiero reservar mi lugar en el evento ${ev.nivel} del día ${ev.fecha.split('-').reverse().join('/')}.`;
                      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msj)}`, '_blank');
                    }}
                    className="rounded-none bg-white text-slate-900 hover:bg-slate-200 px-10 h-16 font-black uppercase w-full sm:w-auto"
                  >
                    Consultar
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}