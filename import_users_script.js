const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const users = [
  {"name": "Jesus Kirkconnell", "email": "jkirkconnell@grupoyc.com", "position": "Jefe de Agencia", "phone": "3144-8528", "city": "La Ceiba"},
  {"name": "Jordy Tejada", "email": "jtejada@grupoyc.com", "position": "Asesor de Ventas", "phone": "3354-2425", "city": "La Ceiba"},
  {"name": "Juan Cesar Matute", "email": "jmatute@grupoyc.com", "position": "Asesor de Ventas", "phone": "3174-4892", "city": "La Ceiba"},
  {"name": "Marvin Valladares", "email": "repuestoscba@grupoyc.com", "position": "Asesor de venta de repuestos", "phone": "3174-5916", "city": "La Ceiba"},
  {"name": "Norman Sambula", "email": "asesorceiba@grupoyc.com", "position": "Asesor Taller de Servicios", "phone": "3149-0702", "city": "La Ceiba"},
  {"name": "Juan Quezada", "email": "jquezada@grupoyc.com", "position": "Asesor Mayoreo Repuestos", "phone": "3174-0000", "city": "La Ceiba"},
  {"name": "Jose Luis Ramirez Funez", "email": "gerenciageneral@grupoyc.com", "position": "Gerente General", "phone": "3192-4632", "city": "San Pedro Sula"},
  {"name": "Jose Daniel Quesada", "email": "joseqc@grupoyc.com", "position": "Gerente Administrativo", "phone": "3174-4176", "city": "San Pedro Sula"},
  {"name": "Maria Alexandra Canahuati", "email": "mav@grupoyc.com", "position": "Gerente Comercial", "phone": "3191-0833", "city": "San Pedro Sula"},
  {"name": "David Mejia Paz", "email": "gerencialogistica@grupoyc.com", "position": "Gerente de Proveeduria", "phone": "3174-3681", "city": "San Pedro Sula"},
  {"name": "Laura Nohelia Izaguirre", "email": "jefemercadeo@grupoyc.com", "position": "Jefe de Mercadeo", "phone": "3174-5771", "city": "San Pedro Sula"},
  {"name": "Romer Efrain Dubon", "email": "rdubon@grupoyc.com", "position": "Jefe de Ventas", "phone": "3191-7973", "city": "San Pedro Sula"},
  {"name": "Walter Mata", "email": "gerenciaservicios@grupoyc.com", "position": "Gerente de Servicios", "phone": "3174-5303", "city": "San Pedro Sula"},
  {"name": "Francisco Solis", "email": "pedidos@grupoyc.com", "position": "Encargado de Compras", "phone": "3174-5354", "city": "San Pedro Sula"},
  {"name": "Edwin Baide", "email": "importaciones@grupoyc.com", "position": "Administrador de Importaciones", "phone": "3174-3237", "city": "San Pedro Sula"},
  {"name": "Lorena Morales", "email": "lmorales@grupoyc.com", "position": "Asesor de Ventas", "phone": "3174-5373", "city": "San Pedro Sula"},
  {"name": "Cesia Galeas", "email": "cgaleas@grupoyc.com", "position": "Asesor de Ventas", "phone": "3174-5341", "city": "San Pedro Sula"},
  {"name": "Cristhian Medina", "email": "cmedina@grupoyc.com", "position": "Asesor de Ventas", "phone": "3170-6148", "city": "San Pedro Sula"},
  {"name": "Erik Nuñez", "email": "asistente2.quicklane@grupoyc.com", "position": "Asesor de servicio", "phone": "3149-1634", "city": "San Pedro Sula"},
  {"name": "Nestor Gutierrez", "email": "asistente.quicklane@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-5246", "city": "San Pedro Sula"},
  {"name": "Moises Trochez", "email": "repuestos8@grupoyc.com", "position": "Asesor de venta de repuestos", "phone": "3174-4959", "city": "San Pedro Sula"},
  {"name": "Javier Mejia", "email": "administrador.quicklane@grupoyc.com", "position": "Jefe de Unidad", "phone": "3174-5613", "city": "San Pedro Sula"},
  {"name": "Kevin Ramirez", "email": "asistente2.quicklane.kv@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-4728", "city": "San Pedro Sula"},
  {"name": "Roger Reyes", "email": "asesor1@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-4757", "city": "San Pedro Sula"},
  {"name": "Nahun Carballo", "email": "nahunc@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-5831", "city": "San Pedro Sula"},
  {"name": "Maynor Sarmiento", "email": "msarmiento@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-1375", "city": "San Pedro Sula"},
  {"name": "Salatiel Aleman", "email": "asesorpinturas@grupoyc.com", "position": "Jefe Taller de Pintura", "phone": "3174-4700", "city": "San Pedro Sula"},
  {"name": "Andy Escobar", "email": "aescobar@grupoyc.com", "position": "Asesor Mayoreo Repuestos", "phone": "3170-6201", "city": "San Pedro Sula"},
  {"name": "Jose Rivera", "email": "asistente3.quicklane@grupoyc.com", "position": "Asesor de servicio", "phone": "3170-6294", "city": "San Pedro Sula"},
  {"name": "Carlos Aguilar", "email": "asesorpinturasps02@grupoyc.com", "position": "Asesor de servicio pintura", "phone": "3174-5039", "city": "San Pedro Sula"},
  {"name": "Krystel Marcos", "email": "rrhh@grupoyc.com", "position": "Jefe de Recursos Humanos", "phone": "3174-4027", "city": "San Pedro Sula"},
  {"name": "Javier Madrid Umaña", "email": "jmadrid@grupoyc.com", "position": "Gerente Regional", "phone": "3392-0531", "city": "Tegucigalpa"},
  {"name": "Jose Jesus Escoto", "email": "informatica2@grupoyc.com", "position": "Jefe de Informatica", "phone": "3174-5791", "city": "Tegucigalpa"},
  {"name": "Sonia Aquino", "email": "saquino@grupoyc.com", "position": "Asesor de Ventas", "phone": "3174-4992", "city": "Tegucigalpa"},
  {"name": "Joel Lopez", "email": "jherrera@grupoyc.com", "position": "Asesor de Ventas", "phone": "3174-1355", "city": "Tegucigalpa"},
  {"name": "Gloria Martinez", "email": "gmartinez@grupoyc.com", "position": "Jefa de Ventas Repuestos", "phone": "3174-4973", "city": "Tegucigalpa"},
  {"name": "Gustavo Avila", "email": "repuestos2.quickparts@grupoyc.com", "position": "Asesor de ventas Repuestos", "phone": "3174-4691", "city": "Tegucigalpa"},
  {"name": "Erik Aguilar", "email": "asesortaller2@grupoyc.com", "position": "Asesor de servicio", "phone": "3149-1634", "city": "Tegucigalpa"},
  {"name": "Franklin Oyuela", "email": "asesortaller1@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-4764", "city": "Tegucigalpa"},
  {"name": "Miguel Betancourt", "email": "administrardortgu.quicklane@grupoyc.com", "position": "Jefe de Unidad", "phone": "3174-5451", "city": "Tegucigalpa"},
  {"name": "Carlos Valladares", "email": "repuestos1.quickparts@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-3668", "city": "Tegucigalpa"},
  {"name": "Mario Espinoza", "email": "repuestos3.quickparts@grupoyc.com", "position": "Asesor de servicio", "phone": "3174-3245", "city": "Tegucigalpa"}
];

async function main() {
  const secret = process.env.NEXTAUTH_SECRET || 'VpMps4Qc8rUv0G2VnvonGqQCylzTfAE4'; // Fallback for script
  const baseUrl = process.env.NEXTAUTH_URL || 'http://yctest.hopto.org';

  console.log('Starting bulk import...');

  for (const userData of users) {
    try {
      const branch = await prisma.branch.findFirst({
        where: {
          OR: [
            { city: { contains: userData.city, mode: 'insensitive' } },
            { name: { contains: userData.city, mode: 'insensitive' } }
          ]
        }
      });

      if (!branch) {
        console.warn(`[SKIP] No branch found for city ${userData.city} (User: ${userData.name})`);
        continue;
      }

      let user = await prisma.user.findUnique({ where: { email: userData.email } });
      if (!user) {
        const password = await bcrypt.hash(Math.random().toString(36).substring(2, 12), 10);
        user = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password,
            role: 'ADVISOR',
            isSystemUser: false,
            position: userData.position,
            phone: userData.phone,
            branchId: branch.id,
            isActive: true
          }
        });
        console.log(`[CREATE] User: ${userData.name} (${userData.email})`);
      }

      const existingVCard = await prisma.vCard.findFirst({ where: { userId: user.id } });
      if (!existingVCard) {
        const qrCodeData = uuidv4();
        const signature = CryptoJS.HmacSHA256(qrCodeData, secret).toString(CryptoJS.enc.Hex);
        const publicUrl = `${baseUrl}/vcard/${qrCodeData}?sig=${signature}`;
        const qrImageUrl = await QRCode.toDataURL(publicUrl, { 
          width: 400, 
          margin: 2, 
          color: { dark: '#003478', light: '#FFFFFF' } 
        });

        await prisma.vCard.create({
          data: {
            userId: user.id,
            branchId: branch.id,
            qrCodeData,
            qrImageUrl,
            isActive: true
          }
        });
        console.log(`[CREATE] VCard for ${userData.name}`);
      } else {
        console.log(`[EXISTS] VCard for ${userData.name}`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to process ${userData.name}:`, err.message);
    }
  }

  console.log('Bulk import finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
