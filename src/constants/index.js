// ===== COLORS =====
export const C = {
  primary:      '#D90B24',
  primaryDark:  '#A5081B',
  primaryLight: '#FF6678',
  secondary:    '#004BCC',
  accent:       '#FFC400',
  success:      '#00c853',
  warning:      '#ffc107',
  dark:         '#101828',
  darkLight:    '#243247',
  gray:         '#6b7280',
  grayLight:    '#e5e7eb',
  white:        '#ffffff',
  gradient:     'linear-gradient(135deg, #D90B24 0%, #004BCC 100%)',
  gradientHot:  'linear-gradient(135deg, #004BCC 0%, #FFC400 100%)',
}

export const RIFA_CATEGORIES = [
  { value: 'vehicles', label: 'Vehículos', icon: 'fa-car' },
  { value: 'motorcycles', label: 'Motocicletas', icon: 'fa-motorcycle' },
  { value: 'technology', label: 'Tecnología', icon: 'fa-mobile-screen' },
  { value: 'cash', label: 'Dinero', icon: 'fa-money-bill-wave' },
  { value: 'home', label: 'Hogar', icon: 'fa-house' },
  { value: 'real_estate', label: 'Inmuebles', icon: 'fa-building' },
  { value: 'travel', label: 'Viajes', icon: 'fa-plane' },
  { value: 'appliances', label: 'Electrodomésticos', icon: 'fa-plug' },
  { value: 'experiences', label: 'Experiencias', icon: 'fa-star' },
  { value: 'charity', label: 'Beneficencia', icon: 'fa-hand-holding-heart' },
  { value: 'other', label: 'Otros', icon: 'fa-box-open' },
]

// ===== PRICING PLANS (DOP - Peso Dominicano) =====
// Competencia: PegaTuSuerte cobra RD$900 flat. Nosotros somos más baratos y escalados.
export const PLANS = [
  {
    id: 'demo',
    price: 0,
    label: 'Gratis',
    period: '7 días',
    featured: false,
    maxTickets: 50,
    maxRifas: 1,
    features: ['Acceso de prueba', 'Talonario demo', 'Panel administrativo', 'Sin dominio propio', 'Ideal para conocer el sistema']
  },
  {
    id: 'basic',
    price: 999,
    label: 'Básico',
    period: 'pago único',
    featured: true,
    maxTickets: 1000,
    maxRifas: 1,
    stripeLink: import.meta.env.VITE_STRIPE_BASIC_LINK || '',
    features: ['1 rifa activa', 'Hasta 1,000 tickets', 'Métodos de pago', 'Venta manual', 'WhatsApp integrado', 'Personalización básica', 'Historial de tickets']
  },
  {
    id: 'pro',
    price: 1999,
    label: 'PRO',
    period: 'pago único',
    featured: false,
    maxTickets: 999999,
    maxRifas: 999999,
    stripeLink: import.meta.env.VITE_STRIPE_PRO_LINK || '',
    features: ['Rifas ilimitadas', 'Tickets avanzados', 'Paquetes y descuentos', 'Reportes PDF/Excel', 'Métricas avanzadas', 'Personalización completa', 'Soporte prioritario']
  }
]


// ===== FEATURES =====
export const FEATURES = [
  { icon: 'fa-ticket',       title: 'Talonario Digital',    desc: 'Crea tu talonario web personalizado donde los participantes eligen y apartan sus numeros en tiempo real.' },
  { icon: 'fa-qrcode',       title: 'Tickets con QR',       desc: 'Cada ticket incluye un codigo QR unico verificable. Evita duplicados y genera confianza.' },
  { icon: 'fa-cloud',        title: 'En la Nube',           desc: 'Datos respaldados y accesibles 24/7 desde cualquier dispositivo. Nunca pierdas informacion.' },
  { icon: 'fa-shuffle',      title: 'Sorteo Certificado',   desc: 'Sortea de forma transparente con certificacion digital. 1er, 2do y 3er premio en un solo click.' },
  { icon: 'fa-chart-line',   title: 'Analytics en Vivo',    desc: 'Dashboard con metricas en tiempo real: ventas, participantes, progreso y proyecciones.' },
  { icon: 'fa-share-nodes',  title: 'Viral por WhatsApp',   desc: 'Comparte con un clic. Links personalizados, integracion con WhatsApp e Instagram.' },
  { icon: 'fa-users',        title: 'Sistema de Referidos', desc: 'Tus participantes invitan amigos y ganan descuentos o numeros gratis automaticamente.' },
  { icon: 'fa-shield-halved',title: 'Seguridad Total',      desc: 'Encriptacion, verificacion de identidad y apartado con temporizador de 24 horas.' },
]

// ===== HOW IT WORKS =====
export const STEPS = [
  { num: 1, title: 'Registrate',        desc: 'Crea tu cuenta gratis en menos de 2 minutos',                      icon: 'fa-user-plus' },
  { num: 2, title: 'Configura tu Rifa', desc: 'Personaliza premios, numeros, precios y diseno',                   icon: 'fa-sliders' },
  { num: 3, title: 'Comparte el Link',  desc: 'Envia tu talonario por WhatsApp y redes sociales',                icon: 'fa-share' },
  { num: 4, title: 'Gestiona Ventas',   desc: 'Controla tickets, pagos y participantes en tu dashboard',          icon: 'fa-chart-pie' },
  { num: 5, title: 'Sortea y Gana',     desc: 'Sorteo multi-premio (1ro, 2do, 3ro) transparente y certificado',  icon: 'fa-trophy' },
]

// ===== FAQ =====
export const FAQS = [
  { q: '¿Como funciona RyffasRD?',              a: 'RyffasRD te permite crear un talonario digital. Configuras tu rifa (premio, tickets, precio), compartes el link, los participantes eligen numeros y tu gestionas todo desde el panel de administracion.' },
  { q: '¿Es gratis?',                            a: 'Si, puedes comenzar gratis con hasta 50 numeros. Para rifas mas grandes, planes desde RD$149 con pago unico (sin mensualidades).' },
  { q: '¿Como funciona el sistema de referidos?',a: 'Cada participante recibe un link unico. Por cada persona que invite y compre un ticket, el referidor obtiene un descuento o numero gratis automaticamente.' },
  { q: '¿Que pasa si no pago en 24 horas?',      a: 'Los numeros apartados se liberan automaticamente despues de 24h si no se confirma el pago. Esto protege al organizador de numeros bloqueados sin pago.' },
  { q: '¿Puedo sortear multiples premios?',      a: 'Si, RyffasRD soporta multi-premio: 1er, 2do y 3er lugar en un solo sorteo. Cada ganador se selecciona de forma transparente.' },
  { q: '¿Se puede instalar en el celular?',      a: 'Si, RyffasRD es una PWA (Progressive Web App). Puedes instalarla en tu celular desde el navegador sin pasar por la Play Store o App Store.' },
  { q: '¿Puedo ver el historial de sorteos?',    a: 'Si, todos los sorteos quedan registrados publicamente con sus ganadores y certificados, generando confianza total para futuros participantes.' },
  { q: '¿Como comparto mi rifa?',                a: 'Con un clic generas un mensaje de WhatsApp pre-armado con tu link y codigo de referido, o copias un widget HTML para tu bio de Instagram.' },
]

// ===== TESTIMONIALS =====
export const TESTIMONIALS = [
  { name: 'Maria G.',   role: 'Organizadora de Rifas', text: 'Llevo 6 meses usando RyffasRD y he triplicado mis ventas. La gente confia mas cuando ve un talonario profesional.', avatar: 'M', rating: 5 },
  { name: 'Carlos R.',  role: 'Emprendedor',            text: 'El sistema de referidos es increible. Mis participantes invitan amigos y las rifas se llenan solas.',                  avatar: 'C', rating: 5 },
  { name: 'Laura P.',   role: 'Fundacion Benef.',       text: 'El historial publico de sorteos nos da la transparencia que nuestros donantes necesitaban. Volvemos siempre.',          avatar: 'L', rating: 5 },
  { name: 'Andres M.',  role: 'Rifero Profesional',     text: 'El countdown y el multi-premio son un game changer. Mis rifas se llenan el doble de rapido.',                           avatar: 'A', rating: 5 },
]

// ===== PAST SORTEOS =====
export const PAST_SORTEOS = [
  { id: 1, name: 'MacBook Air M4',      winner: '#0247 - Carlos M.', date: '20 Mar 2026', tickets: 300, prize2: '#0189 - Ana R.',    prize3: '#0055 - Luis T.'  },
  { id: 2, name: 'Samsung S25 Ultra',   winner: '#0412 - Maria L.',  date: '5 Mar 2026',  tickets: 500, prize2: '#0331 - Pedro G.',  prize3: '#0098 - Sofia K.' },
  { id: 3, name: 'Smart TV 65" LG',     winner: '#0078 - Jorge P.',  date: '15 Feb 2026', tickets: 200, prize2: '#0156 - Diana F.',  prize3: '#0023 - Oscar H.' },
  { id: 4, name: 'iPad Pro 2025',       winner: '#0567 - Camila S.', date: '1 Feb 2026',  tickets: 400, prize2: '#0290 - Ivan D.',   prize3: '#0112 - Rosa M.'  },
]

// ===== DEMO RIFA =====
export const DEMO_RIFA = {
  name:        'PlayStation 5 + 3 Juegos',
  description: '1er: PS5 Digital | 2do: Control Extra | 3ro: RD$3,000 Gift Card',
  prize1:      'PS5 Digital Edition',
  prize2:      'Control DualSense Extra',
  prize3:      'RD$3,000 Gift Card',
  total:       500,
  price:       150,
  sorteoDate:  '2026-04-20T20:00:00',
}
