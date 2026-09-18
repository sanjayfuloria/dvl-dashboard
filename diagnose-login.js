const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAILS = [
  'harsh.choudhary25mh@ibsindia.org',
  'vanshika.saxena25mh@ibsindia.org',
  'pooja.mohta25mh@ibsindia.org',
  'bhavya.bajpai25mh@ibsindia.org',
  'anjali.gupta25mh@ibsindia.org',
];

async function main() {
  for (const email of EMAILS) {
    console.log('\n=== ' + email + ' ===');

    var user;
    try {
      user = await prisma.user.findUnique({ where: { email: email } });
    } catch (e) {
      console.log('ERROR querying User table: ' + e.message);
      continue;
    }

    if (!user) {
      console.log('RESULT: No User record found with this email at all.');
      continue;
    }

    console.log('User ID:      ' + user.id);
    console.log('Name:         ' + user.name);
    console.log('Email:        ' + user.email);
    console.log('Role:         ' + user.role);
    console.log('Created At:   ' + user.createdAt);
    if ('isActive' in user) console.log('Is Active:    ' + user.isActive);
    if ('status' in user) console.log('Status:       ' + user.status);

    try {
      var pw = await prisma.userPassword.findUnique({ where: { userId: user.id } });
      if (!pw) {
        console.log('RESULT: No UserPassword record found - this is very likely the login/reset issue.');
      } else {
        console.log('RESULT: UserPassword record exists.');
        console.log('   Hash length: ' + (pw.password ? pw.password.length : '(no password field - check schema)'));
        console.log('   Updated At:  ' + pw.updatedAt);
      }
    } catch (e) {
      console.log('WARNING: Could not query UserPassword: ' + e.message);
    }

    try {
      var membership = await prisma.teamMember.findMany({
        where: { student: { userId: user.id } },
        include: { team: true },
      });
      if (membership.length === 0) {
        console.log('INFO: No TeamMember record linked to this user.');
      } else {
        membership.forEach(function(m) {
          console.log('   Team: ' + (m.team ? m.team.name : '?') + ' | Section: ' + (m.team ? m.team.section : '?') + ' | Phase: ' + (m.team ? m.team.phase : '?'));
        });
      }
    } catch (e) {
      console.log('WARNING: Could not query TeamMember: ' + e.message);
    }
  }

  await prisma.$disconnect();
}

main().catch(function(e) {
  console.error('Fatal error:', e);
  process.exit(1);
});
