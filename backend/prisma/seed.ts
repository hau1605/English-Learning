import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create permissions
  const permissions = [
    { code: 'user.view', resource: 'user', action: 'view', description: 'View users' },
    { code: 'user.create', resource: 'user', action: 'create', description: 'Create users' },
    { code: 'user.update', resource: 'user', action: 'update', description: 'Update users' },
    { code: 'user.delete', resource: 'user', action: 'delete', description: 'Delete users' },
    { code: 'user.suspend', resource: 'user', action: 'suspend', description: 'Suspend users' },
    { code: 'role.view', resource: 'role', action: 'view', description: 'View roles' },
    { code: 'role.create', resource: 'role', action: 'create', description: 'Create roles' },
    { code: 'role.update', resource: 'role', action: 'update', description: 'Update roles' },
    { code: 'permission.view', resource: 'permission', action: 'view', description: 'View permissions' },
    { code: 'permission.create', resource: 'permission', action: 'create', description: 'Create permissions' },
    { code: 'vocabulary.view', resource: 'vocabulary', action: 'view', description: 'View vocabulary' },
    { code: 'vocabulary.create', resource: 'vocabulary', action: 'create', description: 'Create vocabulary' },
    { code: 'vocabulary.update', resource: 'vocabulary', action: 'update', description: 'Update vocabulary' },
    { code: 'vocabulary.delete', resource: 'vocabulary', action: 'delete', description: 'Delete vocabulary' },
    { code: 'flashcard.view', resource: 'flashcard', action: 'view', description: 'View flashcards' },
    { code: 'flashcard.create', resource: 'flashcard', action: 'create', description: 'Create flashcards' },
    { code: 'quiz.view', resource: 'quiz', action: 'view', description: 'View quizzes' },
    { code: 'quiz.create', resource: 'quiz', action: 'create', description: 'Create quizzes' },
    { code: 'quiz.update', resource: 'quiz', action: 'update', description: 'Update quizzes' },
    { code: 'lesson.view', resource: 'lesson', action: 'view', description: 'View lessons' },
    { code: 'lesson.create', resource: 'lesson', action: 'create', description: 'Create lessons' },
    { code: 'lesson.update', resource: 'lesson', action: 'update', description: 'Update lessons' },
    { code: 'lesson.delete', resource: 'lesson', action: 'delete', description: 'Delete lessons' },
    { code: 'lesson.publish', resource: 'lesson', action: 'publish', description: 'Publish lessons' },
    { code: 'course.create', resource: 'course', action: 'create', description: 'Create courses' },
    { code: 'course.update', resource: 'course', action: 'update', description: 'Update courses' },
    { code: 'course.publish', resource: 'course', action: 'publish', description: 'Publish courses' },
    { code: 'course.delete', resource: 'course', action: 'delete', description: 'Delete courses' },
    { code: 'section.create', resource: 'section', action: 'create', description: 'Create course sections' },
    { code: 'section.update', resource: 'section', action: 'update', description: 'Update course sections' },
    { code: 'section.delete', resource: 'section', action: 'delete', description: 'Delete course sections' },
    { code: 'media.upload', resource: 'media', action: 'upload', description: 'Upload media files' },
    { code: 'media.delete', resource: 'media', action: 'delete', description: 'Delete media files' },
    { code: 'report.view', resource: 'report', action: 'view', description: 'View reports' },
    { code: 'report.export', resource: 'report', action: 'export', description: 'Export reports' },
    { code: 'settings.view', resource: 'settings', action: 'view', description: 'View settings' },
    { code: 'settings.update', resource: 'settings', action: 'update', description: 'Update settings' },
    { code: 'admin.view', resource: 'admin', action: 'view', description: 'View admin dashboard' },
    // Menu permissions
    { code: 'menu.view', resource: 'menu', action: 'view', description: 'View menu management' },
    { code: 'menu.create', resource: 'menu', action: 'create', description: 'Create menu items' },
    { code: 'menu.update', resource: 'menu', action: 'update', description: 'Update menu items' },
    { code: 'menu.delete', resource: 'menu', action: 'delete', description: 'Delete menu items' },
    { code: '*', resource: '*', action: '*', description: 'Full access' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
  }

  console.log('Permissions seeded');

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: {},
    create: {
      name: 'Super Admin',
      code: 'super_admin',
      description: 'Full system access',
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      code: 'admin',
      description: 'Admin access',
      isSystem: true,
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { code: 'teacher' },
    update: {},
    create: {
      name: 'Teacher',
      code: 'teacher',
      description: 'Teacher access',
      isSystem: true,
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { code: 'student' },
    update: {},
    create: {
      name: 'Student',
      code: 'student',
      description: 'Student access',
      isSystem: true,
    },
  });

  console.log('Roles seeded');

  // Assign all permissions to super_admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign basic permissions to admin
  const adminPermissions = await prisma.permission.findMany({
    where: { code: { not: '*' } },
  });
  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign teacher permissions
  const teacherPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: [
          'user.view',
          'vocabulary.view',
          'vocabulary.create',
          'vocabulary.update',
          'flashcard.view',
          'flashcard.create',
          'quiz.view',
          'quiz.create',
          'quiz.update',
          'lesson.view',
          'lesson.create',
          'lesson.update',
          'lesson.delete',
          'lesson.publish',
          'course.create',
          'course.update',
          'course.publish',
          'section.create',
          'section.update',
          'section.delete',
          'media.upload',
        ],
      },
    },
  });
  for (const perm of teacherPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: teacherRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: teacherRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign student permissions
  const studentPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: [
          'vocabulary.view',
          'flashcard.view',
          'quiz.view',
          'lesson.view',
          'media.upload',
        ],
      },
    },
  });
  for (const perm of studentPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: studentRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: studentRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('Role permissions assigned');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Admin',
      status: 'ACTIVE',
      xp: 10000,
      level: 10,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('Admin user created');

  // Create sample vocabulary topics
  const topics = [
    { name: 'Basic Greetings', slug: 'basic-greetings', description: 'Common greeting words and phrases', icon: '👋' },
    { name: 'Numbers', slug: 'numbers', description: 'Numbers from 1 to 100', icon: '🔢' },
    { name: 'Colors', slug: 'colors', description: 'Basic colors in English', icon: '🎨' },
    { name: 'Family', slug: 'family', description: 'Family members vocabulary', icon: '👨‍👩‍👧‍👦' },
    { name: 'Food & Drinks', slug: 'food-drinks', description: 'Common food and drink vocabulary', icon: '🍕' },
    { name: 'Business English', slug: 'business-english', description: 'Business vocabulary', icon: '💼' },
  ];

  for (const topic of topics) {
    const createdTopic = await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: topic,
    });

    // Create sample vocabularies for each topic
    const vocabSamples = getVocabSamplesForTopic(topic.slug);
    for (const vocab of vocabSamples) {
      await prisma.vocabulary.create({
        data: {
          ...vocab,
          topicId: createdTopic.id,
        },
      });
    }
  }

  console.log('Topics and vocabularies seeded');

  // Seed menu items
  const menuItems = [
    // Student menu items
    { code: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard', orderIndex: 0, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'vocabulary', label: 'Vocabulary', icon: 'BookOpen', path: '/vocabulary', orderIndex: 1, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'flashcards', label: 'Flashcards', icon: 'GraduationCap', path: '/flashcards', orderIndex: 2, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'quizzes', label: 'Quizzes', icon: 'ScrollText', path: '/quizzes', orderIndex: 3, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'grammar', label: 'Grammar', icon: 'BookOpen', path: '/grammar', orderIndex: 4, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'speaking', label: 'Speaking', icon: 'Mic', path: '/speaking', orderIndex: 5, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'leaderboard', label: 'Leaderboard', icon: 'Trophy', path: '/leaderboard', orderIndex: 6, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { code: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics', orderIndex: 7, roles: ['super_admin', 'admin', 'teacher', 'student'] },
    // Admin menu items
    { code: 'admin-dashboard', label: 'Admin Dashboard', icon: 'Shield', path: '/admin', orderIndex: 100, roles: ['super_admin', 'admin'] },
    { code: 'admin-users', label: 'User Management', icon: 'Users', path: '/admin/users', orderIndex: 101, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
    { code: 'admin-vocabulary', label: 'Vocabulary', icon: 'BookOpen', path: '/admin/vocabulary', orderIndex: 102, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
    { code: 'admin-flashcards', label: 'Flashcards', icon: 'GraduationCap', path: '/admin/flashcards', orderIndex: 103, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
    { code: 'admin-quizzes', label: 'Quizzes', icon: 'ScrollText', path: '/admin/quizzes', orderIndex: 104, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
    { code: 'admin-reports', label: 'Reports', icon: 'BarChart3', path: '/admin/reports', orderIndex: 105, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
    { code: 'admin-settings', label: 'Settings', icon: 'Settings', path: '/admin/settings', orderIndex: 106, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
    { code: 'admin-menus', label: 'Menu Management', icon: 'Menu', path: '/admin/menus', orderIndex: 107, parentCode: 'admin-dashboard', roles: ['super_admin', 'admin'] },
  ];

  const createdMenuItems: Record<string, string> = {};

  for (const menu of menuItems) {
    const { roles, parentCode, ...menuData } = menu;
    const parentId = parentCode ? createdMenuItems[parentCode] : null;

    const created = await prisma.menuItem.upsert({
      where: { code: menu.code },
      update: { ...menuData, parentId },
      create: { ...menuData, parentId },
    });

    createdMenuItems[menu.code] = created.id;

    // Assign roles to menu item
    for (const roleCode of roles) {
      const role = await prisma.role.findUnique({ where: { code: roleCode } });
      if (role) {
        await prisma.roleMenuAccess.upsert({
          where: {
            roleId_menuItemId: {
              roleId: role.id,
              menuItemId: created.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            menuItemId: created.id,
          },
        });
      }
    }
  }

  await prisma.menuItem.updateMany({
    where: { code: 'ai' },
    data: { isActive: false },
  });

  console.log('Menu items seeded');

  console.log('Database seeding completed!');
}

function getVocabSamplesForTopic(slug: string) {
  const samples: Record<string, any[]> = {
    'basic-greetings': [
      { word: 'hello', pronunciation: '/həˈloʊ/', meaning: 'A greeting', example: 'Hello, how are you?', difficulty: 1, partOfSpeech: 'interjection' },
      { word: 'goodbye', pronunciation: '/ɡʊdˈbaɪ/', meaning: 'A farewell', example: 'Goodbye, see you tomorrow!', difficulty: 1, partOfSpeech: 'interjection' },
      { word: 'welcome', pronunciation: '/ˈwelkəm/', meaning: 'Greeting someone warmly', example: 'Welcome to our home!', difficulty: 1, partOfSpeech: 'verb' },
      { word: 'please', pronunciation: '/pliːz/', meaning: 'Used to add politeness', example: 'Please help me.', difficulty: 1, partOfSpeech: 'adverb' },
      { word: 'thank you', pronunciation: '/θæŋk juː/', meaning: 'Expression of gratitude', example: 'Thank you for your help.', difficulty: 1, partOfSpeech: 'phrase' },
    ],
    'numbers': [
      { word: 'one', pronunciation: '/wʌn/', meaning: '1', example: 'I have one apple.', difficulty: 1, partOfSpeech: 'number' },
      { word: 'two', pronunciation: '/tuː/', meaning: '2', example: 'Two plus two is four.', difficulty: 1, partOfSpeech: 'number' },
      { word: 'three', pronunciation: '/θriː/', meaning: '3', example: 'Three friends went to the park.', difficulty: 1, partOfSpeech: 'number' },
      { word: 'ten', pronunciation: '/ten/', meaning: '10', example: 'I counted to ten.', difficulty: 1, partOfSpeech: 'number' },
      { word: 'hundred', pronunciation: '/ˈhʌndrəd/', meaning: '100', example: 'A hundred people attended.', difficulty: 2, partOfSpeech: 'number' },
    ],
    'colors': [
      { word: 'red', pronunciation: '/rɛd/', meaning: 'Màu đỏ', example: 'The apple is red.', difficulty: 1, partOfSpeech: 'adjective' },
      { word: 'blue', pronunciation: '/bluː/', meaning: 'Màu xanh dương', example: 'The sky is blue.', difficulty: 1, partOfSpeech: 'adjective' },
      { word: 'green', pronunciation: '/ɡriːn/', meaning: 'Màu xanh lá', example: 'Grass is green.', difficulty: 1, partOfSpeech: 'adjective' },
      { word: 'yellow', pronunciation: '/ˈjɛloʊ/', meaning: 'Màu vàng', example: 'The sun is yellow.', difficulty: 1, partOfSpeech: 'adjective' },
      { word: 'purple', pronunciation: '/ˈpɜːrpəl/', meaning: 'Màu tím', example: 'She likes purple flowers.', difficulty: 2, partOfSpeech: 'adjective' },
    ],
    'family': [
      { word: 'mother', pronunciation: '/ˈmʌðər/', meaning: 'Mẹ', example: 'My mother cooks well.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'father', pronunciation: '/ˈfɑːðər/', meaning: 'Cha', example: 'My father works hard.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'sister', pronunciation: '/ˈsɪstər/', meaning: 'Chị/em gái', example: 'I have one sister.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'brother', pronunciation: '/ˈbrʌðər/', meaning: 'Anh/em trai', example: 'My brother is taller than me.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'grandmother', pronunciation: '/ˈɡrænmʌðər/', meaning: 'Bà', example: 'My grandmother tells stories.', difficulty: 2, partOfSpeech: 'noun' },
    ],
    'food-drinks': [
      { word: 'water', pronunciation: '/ˈwɔːtər/', meaning: 'Nước', example: 'I drink water every day.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'coffee', pronunciation: '/ˈkɔːfi/', meaning: 'Cà phê', example: 'I drink coffee in the morning.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'bread', pronunciation: '/brɛd/', meaning: 'Bánh mì', example: 'I eat bread for breakfast.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'rice', pronunciation: '/raɪs/', meaning: 'Cơm', example: 'We eat rice with every meal.', difficulty: 1, partOfSpeech: 'noun' },
      { word: 'vegetable', pronunciation: '/ˈvɛdʒtəbəl/', meaning: 'Rau củ', example: 'Eat more vegetables.', difficulty: 2, partOfSpeech: 'noun' },
    ],
    'business-english': [
      { word: 'meeting', pronunciation: '/ˈmiːtɪŋ/', meaning: 'Cuộc họp', example: 'We have a meeting at 3 PM.', difficulty: 2, partOfSpeech: 'noun' },
      { word: 'deadline', pronunciation: '/ˈdɛdlaɪn/', meaning: 'Hạn chót', example: 'The deadline is Friday.', difficulty: 2, partOfSpeech: 'noun' },
      { word: 'schedule', pronunciation: '/ˈʃɛdjuːl/', meaning: 'Lịch trình', example: 'Check your schedule.', difficulty: 2, partOfSpeech: 'noun' },
      { word: 'proposal', pronunciation: '/prəˈpoʊzəl/', meaning: 'Đề xuất', example: 'Submit your proposal today.', difficulty: 3, partOfSpeech: 'noun' },
      { word: 'negotiate', pronunciation: '/nɪˈɡoʊʃieɪt/', meaning: 'Đàm phán', example: 'We need to negotiate terms.', difficulty: 3, partOfSpeech: 'verb' },
    ],
  };

  return samples[slug] || [];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
