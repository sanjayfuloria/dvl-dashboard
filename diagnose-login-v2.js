const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAILS = [
  'harsh.choudhary25mh@ibsindia.org',
  'vanshika.saxena25mh@ibsindia.org',
  'pooja.mohta25mh@ibsindia.org',
  'bhavya.bajpai25mh@ibsindia.org',
  'anjali.gupta25mh@ibsindia.org',
];

function looksLikeBcrypt(hash) {
  if (!hash) return false;
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
}

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
    console.log('Role:         ' + user.role);

    try {
      var pw = await prisma.userPassword.findUnique({ where: { userId: user.id } });
      if (!pw) {
        console.log('RESULT: No UserPassword record found - this IS the login issue.');
      } else {
        console.log('UserPassword row ID: ' + pw.id);
        console.log('Hash value:   [' + pw.hash + ']');
        console.log('Hash length:  ' + (pw.hash ? pw.hash.length : 'null'));
        console.log('Valid bcrypt format: ' + looksLikeBcrypt(pw.hash));
      }
    } catch (e) {
      console.log('WARNING: Could not query UserPassword: ' + e.message);
    }

    try {
      var membership = await prisma.teamMember.findMany({
        where: { student: { userId: user.id } },
        include: { team: true },
      });
      membership.forEach(function(m) {
        console.log('Team: ' + (m.team ? m.team.name : '?') + ' | Course: ' + (m.team ? m.team.course : '?') + ' | Phase: ' + (m.team ? m.team.currentPhase : '?'));
      });
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
