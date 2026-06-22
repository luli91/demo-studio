interface Clase {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
}

interface ClasesProps {
  disciplinas: Clase[];
}

export default function Clases({ disciplinas }: ClasesProps) {
  return (
    <section id="clases" className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-100">
      <div className="mb-16">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900">
          Nuestras Clases
        </h2>
        <div className="h-2 w-20 bg-slate-900 mt-4" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {disciplinas.length > 0 ? (
          disciplinas.map((clase, i) => (
            <div key={clase.id} className="group cursor-default">
              <div className="h-80 bg-slate-100 rounded-none overflow-hidden relative mb-6 grayscale group-hover:grayscale-0 transition-all duration-700">
                {clase.imagen_url && clase.imagen_url.trim() !== "" ? (
                  <img 
                    src={clase.imagen_url} 
                    className="w-full h-full object-cover" 
                    alt={clase.titulo} 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-6xl italic">
                    0{i + 1}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {clase.titulo}
              </h3>
              <p className="text-slate-500 mt-2 font-medium leading-relaxed">
                {clase.descripcion}
              </p>
            </div>
          ))
        ) : (
          <p className="text-slate-400 italic col-span-3">
            No hay disciplinas cargadas en este momento.
          </p>
        )}
      </div>
    </section>
  )
}