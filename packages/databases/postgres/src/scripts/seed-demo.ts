import { seedDemoAll } from '../seed/demo/seed-demo-data.js';

async function main() {
  await seedDemoAll();
  console.log('Demo seeding complete');
}

main().catch(err => { console.error(err); process.exit(1); });
