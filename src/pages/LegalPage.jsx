import { useSEO } from '../hooks'

const CONTENT = {
  terms: {
    title: 'Términos de Uso',
    sections: [
      ['Objeto del servicio', 'RyffasRD proporciona herramientas tecnológicas para que organizadores independientes gestionen rifas. Cada organizador es responsable de sus premios, cobros, permisos y cumplimiento legal.'],
      ['Cuentas y seguridad', 'Debes proporcionar información válida, proteger tus credenciales y notificarnos cualquier acceso no autorizado. No puedes usar la plataforma para fraude, suplantación o actividades ilícitas.'],
      ['Pagos y planes', 'Los precios y límites se muestran antes de la compra. Los servicios digitales activados no son transferibles. Cualquier reembolso aplicable se evaluará según el estado del servicio y la legislación vigente.'],
      ['Sorteos', 'El organizador es responsable de validar participantes y entregar premios. La plataforma registra el resultado y una huella de auditoría, pero no sustituye certificaciones o permisos exigidos por autoridades.'],
      ['Disponibilidad', 'Podemos realizar mantenimiento o suspender cuentas que comprometan la seguridad. No garantizamos disponibilidad ininterrumpida frente a fallos de terceros o fuerza mayor.'],
    ],
  },
  privacy: {
    title: 'Política de Privacidad',
    sections: [
      ['Datos tratados', 'Procesamos datos de cuenta, contacto, rifas, reservas y actividad técnica necesarios para prestar el servicio. Los organizadores actúan como responsables de los datos de sus participantes.'],
      ['Finalidad', 'Usamos los datos para autenticar usuarios, operar rifas, prevenir fraude, brindar soporte y cumplir obligaciones legales. No vendemos información personal.'],
      ['Conservación y seguridad', 'Conservamos la información mientras la cuenta esté activa o sea necesaria por obligaciones legales. Aplicamos controles de acceso y políticas de seguridad a nivel de base de datos.'],
      ['Terceros', 'Supabase, Vercel y los proveedores de pago o inteligencia artificial pueden procesar datos estrictamente necesarios bajo sus propias condiciones y medidas de seguridad.'],
      ['Tus derechos', 'Puedes solicitar acceso, corrección o eliminación mediante el WhatsApp de soporte +1 809 907 4452. Algunas operaciones podrán conservarse cuando exista obligación legal.'],
    ],
  },
}

export default function LegalPage({ type }) {
  const content = CONTENT[type] || CONTENT.terms
  useSEO({ title: content.title, description: `${content.title} de RyffasRD.` })
  return (
    <main className="legal-page">
      <h1>{content.title}</h1>
      <p className="legal-updated">Última actualización: 18 de julio de 2026</p>
      {content.sections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
    </main>
  )
}
