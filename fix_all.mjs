import { Client, Storage } from 'node-appwrite';
const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6a1d47300008fc65d5c1')
    .setKey('standard_68d598017415fbeb20c1a7f1017bd104a3d6318470c45fcce427705baaae002e0ab153a4db28ec52feaa917b2b8fd310a8f68c53884bcb506bf65d762833eeff654fb88c5147b725b37a0aa1829a5d3b175a84085abf70951f32f7da22e6384248d9683cabfb4d206ae6b624993794dd5bf091295b411a87dc2ced891b3d6882');
const storage = new Storage(client);
const BUCKET = '6a1d4761001a437b2e02';

// Update all existing files to have read("users") — any logged-in user can view
// This is what the Appwrite SDK session auth will use
const files = await storage.listFiles(BUCKET);
console.log(`Updating ${files.total} files...`);

for (const f of files.files) {
    const userId = f['$permissions']
        .find(p => p.startsWith('update("user:') || p.startsWith('delete("user:'))
        ?.match(/user:([^"]+)/)?.[1];
    
    const newPerms = [
        'read("users")',   // any logged-in user can read via SDK session
        ...(userId ? [`update("user:${userId}")`, `delete("user:${userId}")`] : []),
    ];
    
    const updated = await storage.updateFile(BUCKET, f.$id, undefined, newPerms);
    console.log(`  ✅ ${f.$id.slice(0,16)}... → ${JSON.stringify(updated['$permissions'])}`);
}

// Also update bucket permissions
const updatedBucket = await storage.updateBucket(
    BUCKET, 'CropImages',
    ['read("users")', 'create("users")', 'update("users")', 'delete("users")'],
    true,  // fileSecurity
    true,  // enabled
);
console.log('\nBucket updated:');
console.log('  Permissions:', JSON.stringify(updatedBucket['$permissions']));
console.log('  FileSecurity:', updatedBucket.fileSecurity);
console.log('\nDone!');
