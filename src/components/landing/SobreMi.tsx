export default function SobreMi({ equipo }: { equipo: any[] }) {
  // Si no hay datos, ocultamos la sección o mostramos un mensaje
  if (!equipo || equipo.length === 0) return null;

  return (
    <section id="equipo" className="bg-slate-900 py-32 px-6 text-white relative border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white">
            Nuestro Equipo
          </h2>
          <div className="h-2 w-20 bg-white mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {equipo.map((profe) => (
            <div key={profe.id} className="group relative overflow-hidden bg-slate-800">
              <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={profe.foto} 
                  alt={profe.nombre} 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
                  {profe.nombre}
                </h3>
                <p className="text-slate-300 font-medium text-sm">
                  {profe.rol}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}