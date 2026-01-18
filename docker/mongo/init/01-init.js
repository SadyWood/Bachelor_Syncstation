// docker/mongo/init/01-init.js
// MongoDB initialization script - runs on first container start

print('==============================================');
print('Hoolsy MongoDB Initialization');
print('==============================================');

// Switch to hoolsy_subjects database
db = db.getSiblingDB('hoolsy_subjects');

// Create collections with schema validation
print('Creating subjects collection...');
db.createCollection('subjects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'createdAt'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Subject name - required',
        },
        type: {
          enum: ['person', 'character', 'object', 'location', 'brand', 'other'],
          description: 'Subject type - required',
        },
        aliases: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Alternative names for the subject',
        },
        metadata: {
          bsonType: 'object',
          description: 'Flexible metadata (varies by subject type)',
        },
        externalIds: {
          bsonType: 'object',
          description: 'External IDs (IMDB, TMDB, etc.)',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp - required',
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp',
        },
      },
    },
  },
});

// Create indexes
print('Creating indexes...');
db.subjects.createIndex({ name: 'text', 'aliases': 'text' }, { name: 'subject_text_search' });
db.subjects.createIndex({ type: 1 }, { name: 'subject_type' });
db.subjects.createIndex({ 'externalIds.imdb': 1 }, { sparse: true, name: 'subject_imdb' });
db.subjects.createIndex({ 'externalIds.tmdb': 1 }, { sparse: true, name: 'subject_tmdb' });
db.subjects.createIndex({ createdAt: -1 }, { name: 'subject_created' });

// Create appearances collection (links subjects to content)
print('Creating appearances collection...');
db.createCollection('appearances', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['subjectId', 'contentNodeId', 'startMs', 'endMs'],
      properties: {
        subjectId: {
          bsonType: 'objectId',
          description: 'Reference to subject - required',
        },
        contentNodeId: {
          bsonType: 'int',
          description: 'Reference to content_node in PostgreSQL - required',
        },
        startMs: {
          bsonType: 'int',
          minimum: 0,
          description: 'Start time in milliseconds - required',
        },
        endMs: {
          bsonType: 'int',
          minimum: 0,
          description: 'End time in milliseconds - required',
        },
        confidence: {
          bsonType: 'double',
          minimum: 0,
          maximum: 1,
          description: 'ML confidence score (0-1)',
        },
        source: {
          enum: ['manual', 'ml_auto', 'ml_reviewed'],
          description: 'How this appearance was created',
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional appearance metadata',
        },
      },
    },
  },
});

// Create indexes for appearances
db.appearances.createIndex({ subjectId: 1 }, { name: 'appearance_subject' });
db.appearances.createIndex({ contentNodeId: 1 }, { name: 'appearance_content' });
db.appearances.createIndex({ contentNodeId: 1, startMs: 1 }, { name: 'appearance_timeline' });
db.appearances.createIndex({ subjectId: 1, contentNodeId: 1 }, { name: 'appearance_subject_content' });

print('==============================================');
print('MongoDB initialization complete!');
print('==============================================');
