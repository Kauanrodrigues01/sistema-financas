import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  if (!adminEmail || !adminPassword) {
    console.warn(
      '⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD não configurados no .env. Pulando criação do usuário administrador.',
    );
    return;
  }

  // Verifica se o admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✓ Usuário administrador já existe: ${adminEmail}`);
    return;
  }

  // Cria o hash da senha
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Cria o usuário administrador
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      isAdmin: true,
    },
  });

  console.log(`✓ Usuário administrador criado com sucesso: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
