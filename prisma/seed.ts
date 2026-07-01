import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting fresh MongoDB seed...')

    // 1. Create Default Admin from .env (NO fallback defaults — credentials must be in .env)
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD
    if (!adminEmail || !adminPassword) {
      throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set in .env')
    }
    if (adminPassword.length < 12) {
      throw new Error('INITIAL_ADMIN_PASSWORD must be at least 12 characters')
    }
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: { hashedPassword: hashedAdminPassword },
      create: {
        email: adminEmail,
        hashedPassword: hashedAdminPassword,
        name: 'Main Administrator',
        role: 'superadmin',
      },
    })
    console.log('✅ Admin account created:', admin.email)

    // 2. Create a Staff User (to act as author for News/Archives)
    const author = await prisma.user.upsert({
      where: { email: 'staff@otjm-tunisie.org' },
      update: {},
      create: {
        email: 'staff@otjm-tunisie.org',
        name: 'Staff Writer',
        role: 'admin',
      },
    })

    // 3. Create Sample Member & Membership
    const memberEmail = 'member@example.com'
    await prisma.membership.upsert({
      where: { email: memberEmail },
      update: {},
      create: {
        email: memberEmail,
        name: 'Sample Member',
        tier: 'young-doctor',
        status: 'active',
        paymentMethod: 'konnect',
        paymentStatus: 'paid',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        price: 60,
        memberStatus: 'Valid',
        faculty: 'Medicine Tunis',
      },
    })
    console.log('✅ Sample member created:', memberEmail)

    // 4. Create Sample News
    await prisma.news.deleteMany() // Clear old news
    await prisma.news.createMany({
      data: [
        {
          title: 'Manifestation nationale des jeunes médecins',
          excerpt: 'Revendication pour de meilleures conditions de travail.',
          content: 'Les jeunes médecins de Tunisie organisent une manifestation nationale...',
          category: 'protests',
          imageUrl: 'https://picsum.photos/seed/protest1/600/400.jpg',
          authorId: author.id,
          published: true,
        },
        {
          title: 'Welcome to OTJM Admin System',
          excerpt: 'Comprehensive dashboard implemented.',
          content: 'The new system includes user management and real-time statistics.',
          category: 'announcements',
          imageUrl: 'https://picsum.photos/seed/admin-welcome/600/400.jpg',
          authorId: author.id,
          published: true,
        },
      ],
    })

    // 5. Create Sample Archives
    await prisma.archive.deleteMany()
    await prisma.archive.create({
      data: {
        title: 'Charte des droits et devoirs 2019',
        excerpt: 'Document fondamental définissant les droits des médecins.',
        content: 'Ce document définit les principes éthiques et professionnels.',
        category: 'documents',
        documentType: 'Charte',
        imageUrl: 'https://picsum.photos/seed/archive4/600/400.jpg',
        authorId: author.id,
      },
    })

    console.log('🚀 Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
