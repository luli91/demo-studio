export const ZONAS_AMBA: Record<string, string[]> = {
  "CABA": [
    "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito", "Chacarita", "Coghlan", "Colegiales", 
    "Constitución", "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", "Monte Castro", "Monserrat", 
    "Nueva Pompeya", "Núñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios", 
    "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield", 
    "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", 
    "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"
  ],
  "GBA Norte y Noroeste": [
    "Acassuso", "Beccar", "Bella Vista", "Benavídez", "Billinghurst", "Boulogne Sur Mer", "Campo de Mayo", "Carapachay", "Caseros",
     "Ciudad del Libertador General José de San Martín", "Ciudad Jardín El Libertador", "Ciudad Jardín Lomas del Palomar", 
     "Ciudadela", "Del Viso", "Dique Luján", "Don Torcuato", "El Libertador", "El Palomar", "El Talar", "El Triángulo", "Florida",
      "Florida Oeste", "General Pacheco", "Grand Bourg", "Ingeniero Adolfo Sourdeaux", "Ingeniero Pablo Nogués", "José C. Paz", 
      "José Ingenieros", "La Lucila", "Loma Hermosa", "Los Polvorines", "Martín Coronado", "Martínez", "Munro", "Muñiz", "Olivos",
       "Once de Septiembre", "Pablo Podestá", "Remedios de Escalada (Tres de Febrero)", "Ricardo Rojas", "Rincón de Milberg",
        "Sáenz Peña", "San Fernando", "San Isidro", "San Martín", "San Miguel", "Santos Lugares", "Tigre", "Tierras Altas", 
        "Tortuguitas", "Troncos del Talar", "Vicente López", "Victoria", "Villa Adelina", "Villa Ballester", "Villa Bosch", 
        "Villa de Mayo", "Villa Lynch", "Villa Maipú", "Villa Martelli", "Villa Raffo", "Virreyes"
  ],
  "GBA Oeste": [
    "20 de Junio", "Aldo Bonzi", "Castelar", "Celina", "Ciudad Evita", "Cuartel V", "Francisco Álvarez", "González Catán", 
    "Gregorio de Laferrere", "Haedo", "Hurlingham", "Isidro Casanova", "Ituzaingó", "La Reja", "La Tablada", "Libertad", 
    "Lomas del Mirador", "Mariano Acosta", "Merlo", "Moreno", "Morón", "Paso del Rey", "Pontevedra", "Rafael Castillo", 
    "Ramos Mejía", "San Antonio de Padua", "San Justo", "Tapiales", "Trujui", "Villa Luzuriaga", "Villa Madero", "Villa Sarmiento",
     "Villa Tesei", "Villa Udaondo", "Virrey del Pino", "William C. Morris"
  ],
  "GBA Sur": [
    "9 de Abril", "Adrogué", "Avellaneda Centro", "Banfield", "Bernal", "Bosques", "Burzaco", "Canning", "Carlos Spegazzini", 
    "Claypole", "Dock Sud", "Don Bosco", "Don Orione", "El Jagüel", "El Pato", "Estanislao Severo Zeballos", "Ezeiza", "Ezpeleta",
     "Fraile Manuel de Torres", "Gerli", "Glew", "Gobernador Julio A. Costa", "Hudson", "Ingeniero Budge", "Ingeniero Juan Allan", 
     "José Mármol", "Juan María Gutiérrez", "La Unión", "Lanús", "Llavallol", "Lomas de Zamora", "Longchamps", "Luis Guillón", 
     "Malvinas Argentinas (Alte. Brown)", "Ministro Rivadavia", "Monte Chingolo", "Monte Grande", "Pereyra", "Piñeyro", "Plátanos",
      "Quilmes", "Ranelagh", "Remedios de Escalada (Lanús)", "San Francisco de Asís", "San Francisco Solano", "San José", 
      "San Juan Bautista", "Sarandí", "Sourigues", "Temperley", "Tristán Suárez", "Turdera", "Valentín Alsina", "Villa Albertina",
       "Villa Brown", "Villa Centenario", "Villa Domínico", "Villa España", "Villa Fiorito", "Villa La Florida", "Villa San Luis",
        "Villa Santa Rosa", "Wilde"
  ]
};

// Te armo este helper para ordenar alfabéticamente las listas en los selects
Object.keys(ZONAS_AMBA).forEach(region => {
  ZONAS_AMBA[region].sort((a, b) => a.localeCompare(b));
});