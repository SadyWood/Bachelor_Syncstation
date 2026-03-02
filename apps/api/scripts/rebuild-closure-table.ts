// apps/api/scripts/rebuild-closure-table.ts
/**
 * Rebuild the content_closure table for all existing nodes.
 * This is needed because nodes created before closure logic was added
 * have no rows in the closure table.
 *
 * Run with: tsx apps/api/scripts/rebuild-closure-table.ts
 */

import { sql } from 'drizzle-orm';
import { dbWs, schema } from '../src/db.js';

async function rebuildClosureTable() {
  console.log('🔧 Rebuilding content_closure table...\n');

  try {
    // 1. Clear existing closure table
    console.log('1. Clearing existing closure table...');
    await dbWs.delete(schema.contentClosure);
    console.log('   ✅ Cleared\n');

    // 2. Get all nodes ordered by hierarchy (roots first, then children)
    console.log('2. Fetching all nodes...');
    const allNodes = await dbWs
      .select({
        nodeId: schema.contentNodes.nodeId,
        parentId: schema.contentNodes.parentId,
        title: schema.contentNodes.title,
      })
      .from(schema.contentNodes)
      .orderBy(schema.contentNodes.createdAt);

    console.log(`   Found ${allNodes.length} nodes\n`);

    // 3. Insert self-closure for all nodes
    console.log('3. Inserting self-closure rows (depth=0)...');
    const selfClosures = allNodes.map((node) => ({
      ancestorId: node.nodeId,
      descendantId: node.nodeId,
      depth: 0,
    }));

    if (selfClosures.length > 0) {
      await dbWs.insert(schema.contentClosure).values(selfClosures);
      console.log(`   ✅ Inserted ${selfClosures.length} self-closure rows\n`);
    }

    // 4. Build parent-child relationships
    console.log('4. Building ancestor relationships...');
    let totalAncestorRows = 0;

    for (const node of allNodes) {
      if (node.parentId === null) {
        // Root node - already has self-closure
        continue;
      }

      // Get all ancestors of the parent
      const parentAncestors = await dbWs
        .select({
          ancestorId: schema.contentClosure.ancestorId,
          depth: schema.contentClosure.depth,
        })
        .from(schema.contentClosure)
        .where(sql`${schema.contentClosure.descendantId} = ${node.parentId}`);

      if (parentAncestors.length === 0) {
        console.warn(
          `   ⚠️  Warning: Parent ${node.parentId} not found for node ${node.nodeId} (${node.title})`,
        );
        continue;
      }

      // For each ancestor of parent, add (ancestor, this_node, depth+1)
      const ancestorRows = parentAncestors.map((a) => ({
        ancestorId: a.ancestorId,
        descendantId: node.nodeId,
        depth: a.depth + 1,
      }));

      if (ancestorRows.length > 0) {
        await dbWs.insert(schema.contentClosure).values(ancestorRows);
        totalAncestorRows += ancestorRows.length;
      }
    }

    console.log(`   ✅ Inserted ${totalAncestorRows} ancestor relationship rows\n`);

    // 5. Verify results
    console.log('5. Verification:');
    const [closureCount] = await dbWs
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.contentClosure);

    console.log(`   Total closure rows: ${closureCount.count}`);
    console.log(`   Expected: ${selfClosures.length + totalAncestorRows}`);
    console.log(
      `   Match: ${closureCount.count === selfClosures.length + totalAncestorRows ? '✅' : '❌'}\n`,
    );

    // 6. Show some examples
    console.log('6. Example: Project trees');
    const projects = allNodes.filter((n) => n.parentId === null);

    for (const project of projects.slice(0, 3)) {
      // Show first 3 projects
      const descendants = await dbWs
        .select({
          nodeId: schema.contentNodes.nodeId,
          title: schema.contentNodes.title,
          depth: schema.contentClosure.depth,
        })
        .from(schema.contentClosure)
        .innerJoin(
          schema.contentNodes,
          sql`${schema.contentClosure.descendantId} = ${schema.contentNodes.nodeId}`,
        )
        .where(sql`${schema.contentClosure.ancestorId} = ${project.nodeId}`)
        .orderBy(schema.contentClosure.depth);

      console.log(`\n   Project: ${project.title} (${project.nodeId})`);
      for (const desc of descendants) {
        const indent = '  '.repeat(desc.depth);
        console.log(`   ${indent}└─ ${desc.title} (depth: ${desc.depth})`);
      }
    }

    console.log('\n✅ Closure table rebuilt successfully!\n');
  } catch (error) {
    console.error('❌ Error rebuilding closure table:', error);
    throw error;
  }
}

// Run the script
rebuildClosureTable()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
