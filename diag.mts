import { prisma } from './lib/prisma';
const folders = await prisma.folder.findMany({ select: { id:true, name:true, createdById:true, isSensitive:true, createdBy:{ select:{ name:true, email:true } } } });
console.log('FOLDERS:');
for (const f of folders) console.log(`  ${f.name} | sensitive=${f.isSensitive} | createdById=${f.createdById ?? 'NULL'} | creator=${f.createdBy?.email ?? '-'}`);
const users = await prisma.user.findMany({ select: { id:true, email:true, name:true } });
console.log('USERS:');
for (const u of users) console.log(`  ${u.email} | ${u.id} | ${u.name}`);
await prisma.$disconnect();
