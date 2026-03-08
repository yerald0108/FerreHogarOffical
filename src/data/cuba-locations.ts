export interface Province {
  name: string;
  municipalities: string[];
}

export const provinces: Province[] = [
  {
    name: 'Pinar del Río',
    municipalities: ['Pinar del Río', 'Consolación del Sur', 'Guane', 'La Palma', 'Los Palacios', 'Mantua', 'Minas de Matahambre', 'San Juan y Martínez', 'San Luis', 'Sandino', 'Viñales'],
  },
  {
    name: 'Artemisa',
    municipalities: ['Artemisa', 'Alquízar', 'Bahía Honda', 'Bauta', 'Caimito', 'Candelaria', 'Guanajay', 'Güira de Melena', 'Mariel', 'San Antonio de los Baños', 'San Cristóbal'],
  },
  {
    name: 'La Habana',
    municipalities: ['Arroyo Naranjo', 'Boyeros', 'Centro Habana', 'Cerro', 'Cotorro', 'Diez de Octubre', 'Guanabacoa', 'La Habana del Este', 'La Habana Vieja', 'La Lisa', 'Marianao', 'Playa', 'Plaza de la Revolución', 'Regla', 'San Miguel del Padrón'],
  },
  {
    name: 'Mayabeque',
    municipalities: ['San José de las Lajas', 'Batabanó', 'Bejucal', 'Güines', 'Jaruco', 'Madruga', 'Melena del Sur', 'Nueva Paz', 'Quivicán', 'San Nicolás de Bari', 'Santa Cruz del Norte'],
  },
  {
    name: 'Matanzas',
    municipalities: ['Matanzas', 'Calimete', 'Cárdenas', 'Ciénaga de Zapata', 'Colón', 'Jagüey Grande', 'Jovellanos', 'Limonar', 'Los Arabos', 'Martí', 'Pedro Betancourt', 'Perico', 'Unión de Reyes'],
  },
  {
    name: 'Villa Clara',
    municipalities: ['Santa Clara', 'Caibarién', 'Camajuaní', 'Cifuentes', 'Corralillo', 'Encrucijada', 'Manicaragua', 'Placetas', 'Quemado de Güines', 'Ranchuelo', 'Remedios', 'Sagua la Grande', 'Santo Domingo'],
  },
  {
    name: 'Cienfuegos',
    municipalities: ['Cienfuegos', 'Abreus', 'Aguada de Pasajeros', 'Cruces', 'Cumanayagua', 'Lajas', 'Palmira', 'Rodas'],
  },
  {
    name: 'Sancti Spíritus',
    municipalities: ['Sancti Spíritus', 'Cabaiguán', 'Fomento', 'Jatibonico', 'La Sierpe', 'Taguasco', 'Trinidad', 'Yaguajay'],
  },
  {
    name: 'Ciego de Ávila',
    municipalities: ['Ciego de Ávila', 'Baraguá', 'Bolivia', 'Chambas', 'Ciro Redondo', 'Florencia', 'Majagua', 'Morón', 'Primero de Enero', 'Venezuela'],
  },
  {
    name: 'Camagüey',
    municipalities: ['Camagüey', 'Carlos Manuel de Céspedes', 'Esmeralda', 'Florida', 'Guáimaro', 'Jimaguayú', 'Minas', 'Najasa', 'Nuevitas', 'Santa Cruz del Sur', 'Sibanicú', 'Sierra de Cubitas', 'Vertientes'],
  },
  {
    name: 'Las Tunas',
    municipalities: ['Las Tunas', 'Amancio', 'Colombia', 'Jesús Menéndez', 'Jobabo', 'Majibacoa', 'Manatí', 'Puerto Padre'],
  },
  {
    name: 'Holguín',
    municipalities: ['Holguín', 'Antilla', 'Báguanos', 'Banes', 'Cacocum', 'Calixto García', 'Cueto', 'Frank País', 'Gibara', 'Mayarí', 'Moa', 'Rafael Freyre', 'Sagua de Tánamo', 'Urbano Noris'],
  },
  {
    name: 'Granma',
    municipalities: ['Bayamo', 'Bartolomé Masó', 'Buey Arriba', 'Campechuela', 'Cauto Cristo', 'Guisa', 'Jiguaní', 'Manzanillo', 'Media Luna', 'Niquero', 'Pilón', 'Río Cauto', 'Yara'],
  },
  {
    name: 'Santiago de Cuba',
    municipalities: ['Santiago de Cuba', 'Contramaestre', 'Guamá', 'Mella', 'Palma Soriano', 'San Luis', 'Segundo Frente', 'Songo-La Maya', 'Tercer Frente'],
  },
  {
    name: 'Guantánamo',
    municipalities: ['Guantánamo', 'Baracoa', 'Caimanera', 'El Salvador', 'Imías', 'Maisí', 'Manuel Tames', 'Niceto Pérez', 'San Antonio del Sur', 'Yateras'],
  },
  {
    name: 'Isla de la Juventud',
    municipalities: ['Isla de la Juventud'],
  },
];

export const getProvinceNames = (): string[] => provinces.map((p) => p.name);

export const getMunicipalitiesByProvince = (provinceName: string): string[] => {
  const province = provinces.find((p) => p.name === provinceName);
  return province ? province.municipalities : [];
};
