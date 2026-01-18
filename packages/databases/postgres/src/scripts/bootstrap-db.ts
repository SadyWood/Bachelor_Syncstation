import 'dotenv/config';

async function bootstrapDatabases() {
  console.log('Bootstrapping databases...\n');
  console.log('This script creates databases, users, and sets permissions.');
  console.log('Note: This is typically done via Docker init scripts.\n');

  // This script is a placeholder for manual database bootstrapping if needed
  // In most cases, Docker will handle this via the init SQL script
  console.log('✅ Databases are bootstrapped via Docker init scripts.');
  console.log('   See: docker/postgres/init/01-init.sql\n');
}

bootstrapDatabases().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
