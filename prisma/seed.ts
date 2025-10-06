import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Permissões do módulo Users
const userPermissions = [
  {
    codename: 'add_user',
    name: 'Adicionar Usuário',
    module: 'users',
    description: 'Permite criar novos usuários',
  },
  {
    codename: 'view_user',
    name: 'Visualizar Usuário',
    module: 'users',
    description: 'Permite visualizar informações de usuários',
  },
  {
    codename: 'change_user',
    name: 'Alterar Usuário',
    module: 'users',
    description: 'Permite editar informações de usuários',
  },
  {
    codename: 'delete_user',
    name: 'Deletar Usuário',
    module: 'users',
    description: 'Permite excluir usuários',
  },
  {
    codename: 'assign_user_roles',
    name: 'Atribuir Roles a Usuário',
    module: 'users',
    description: 'Permite atribuir roles a usuários',
  },
  {
    codename: 'assign_user_permissions',
    name: 'Atribuir Permissões a Usuário',
    module: 'users',
    description: 'Permite atribuir permissões diretas a usuários',
  },
  {
    codename: 'view_user_permissions',
    name: 'Visualizar Permissões do Usuário',
    module: 'users',
    description: 'Permite visualizar todas as permissões de um usuário',
  },
  {
    codename: 'toggle_user_active',
    name: 'Ativar/Desativar Usuário',
    module: 'users',
    description: 'Permite ativar ou desativar usuários',
  },
];

async function seedPermissions() {
  console.log('🌱 Criando permissões do módulo users...');

  for (const permission of userPermissions) {
    await prisma.permission.upsert({
      where: { codename: permission.codename },
      update: permission,
      create: permission,
    });
  }

  console.log(`✓ ${userPermissions.length} permissões criadas/atualizadas`);
}

async function seedSuperAdmin() {
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
    console.log(`✓ Usuário super administrador já existe: ${adminEmail}`);
    return;
  }

  // Cria o hash da senha
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Cria o usuário super administrador
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      isSuperAdmin: true,
      tenantId: null, // Super Admin não pertence a nenhum tenant
      isActive: true,
    },
  });

  console.log(`✓ Super administrador criado com sucesso: ${admin.email}`);
}

async function main() {
  console.log('🚀 Iniciando seed do banco de dados...\n');

  // 1. Criar permissões
  await seedPermissions();

  // 2. Criar super admin
  await seedSuperAdmin();

  console.log('\n✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
