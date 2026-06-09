import { PrismaClient, Role, Course, ProjectPhase } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dvl.ifhe.edu.in' },
    update: {},
    create: {
      email: 'admin@dvl.ifhe.edu.in',
      name: 'DVL Admin',
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Faculty user
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@ifhe.edu.in' },
    update: {},
    create: {
      email: 'faculty@ifhe.edu.in',
      name: 'Dr. Sample Faculty',
      role: Role.FACULTY,
      emailVerified: new Date(),
      facultyProfile: {
        create: {
          department: 'Digital Business',
          designation: 'Associate Professor',
        },
      },
    },
  })
  console.log('✅ Faculty created:', facultyUser.email)

  // Mentor user
  const mentorUser = await prisma.user.upsert({
    where: { email: 'mentor@example.com' },
    update: {},
    create: {
      email: 'mentor@example.com',
      name: 'Rajesh Kumar',
      role: Role.MENTOR,
      emailVerified: new Date(),
      mentorProfile: {
        create: {
          organisation: 'TechVentures India',
          designation: 'CEO',
          expertise: ['Product Management', 'AI/ML', 'SaaS'],
          industry: 'Technology',
          availability: 'Weekends 10AM-1PM',
        },
      },
    },
  })
  console.log('✅ Mentor created:', mentorUser.email)

  // Student user
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@ifhe.edu.in' },
    update: {},
    create: {
      email: 'student@ifhe.edu.in',
      name: 'Priya Sharma',
      role: Role.STUDENT,
      emailVerified: new Date(),
      studentProfile: {
        create: {
          rollNumber: 'MBA2024001',
          programme: 'MBA',
          batch: '2024-26',
        },
      },
    },
  })
  console.log('✅ Student created:', studentUser.email)

  // Sample team
  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: facultyUser.id },
  })
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: studentUser.id },
  })

  if (facultyProfile && studentProfile) {
    const team = await prisma.team.upsert({
      where: { id: 'team-demo-001' },
      update: {},
      create: {
        id: 'team-demo-001',
        name: 'Team Alpha',
        ventureName: 'AgriConnect',
        course: Course.MPB,
        sector: 'AgriTech',
        currentPhase: ProjectPhase.PROTOTYPE,
        progressPct: 45,
        problemStatement: 'Small farmers lack real-time market price access, causing 30% revenue loss post-harvest.',
        targetUsers: 'Small and marginal farmers in Telangana',
        businessOpportunity: 'Subscription-based platform connecting farmers directly to mandis and buyers',
        aiComponents: 'Price prediction ML model, chatbot for advisory in Telugu',
        technologyStack: 'React Native, FastAPI, TensorFlow, PostgreSQL',
        facultyGuideId: facultyProfile.id,
        members: {
          create: {
            studentProfileId: studentProfile.id,
            role: 'Team Lead',
          },
        },
        milestones: {
          create: [
            {
              phase: ProjectPhase.IDEATION,
              title: 'Problem Brief Submission',
              status: 'APPROVED',
              completedAt: new Date('2025-02-15'),
            },
            {
              phase: ProjectPhase.IDEATION,
              title: 'Business Model Canvas',
              status: 'APPROVED',
              completedAt: new Date('2025-03-01'),
            },
            {
              phase: ProjectPhase.PROTOTYPE,
              title: 'Functional Prototype',
              status: 'IN_PROGRESS',
              dueDate: new Date('2025-08-30'),
            },
          ],
        },
      },
    })
    console.log('✅ Demo team created:', team.name)
  }

  // Sample resources
  await prisma.resource.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Business Model Canvas Template',
        type: 'TEMPLATE',
        description: 'Standard BMC for venture ideation',
        tags: ['BMC', 'ideation', 'strategy'],
        course: Course.MPB,
      },
      {
        title: 'Customer Discovery Interview Guide',
        type: 'TOOLKIT',
        description: '20 questions for customer discovery interviews',
        tags: ['customer discovery', 'interviews', 'validation'],
      },
      {
        title: 'AI Prompt Library for Product Managers',
        type: 'PROMPT_LIBRARY',
        description: '50+ curated prompts for product development tasks',
        tags: ['AI', 'prompts', 'product management'],
      },
      {
        title: 'Digital Transformation Framework',
        type: 'FRAMEWORK',
        description: 'ICFAI DVL framework for enterprise digital transformation',
        tags: ['digital transformation', 'framework'],
        course: Course.MDT,
      },
    ],
  })
  console.log('✅ Sample resources created')

  console.log('\n🎉 Seed complete! Login credentials:')
  console.log('  Admin:   admin@dvl.ifhe.edu.in')
  console.log('  Faculty: faculty@ifhe.edu.in')
  console.log('  Mentor:  mentor@example.com')
  console.log('  Student: student@ifhe.edu.in')
  console.log('  (All users authenticate via magic link email)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
