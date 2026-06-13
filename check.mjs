import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') 
    .setProject('6a1d47300008fc65d5c1')
    .setKey('standard_68d598017415fbeb20c1a7f1017bd104a3d6318470c45fcce427705baaae002e0ab153a4db28ec52feaa917b2b8fd310a8f68c53884bcb506bf65d762833eeff654fb88c5147b725b37a0aa1829a5d3b175a84085abf70951f32f7da22e6384248d9683cabfb4d206ae6b624993794dd5bf091295b411a87dc2ced891b3d6882');

const databases = new Databases(client);

async function check() {
    try {
        console.log("Fetching databases...");
        const dbs = await databases.list();
        console.log("Databases:", dbs.databases.map(d => ({id: d.$id, name: d.name})));
        
        if (dbs.databases.length > 0) {
            const dbId = dbs.databases[0].$id;
            console.log(`\nFetching collections for DB ${dbId}...`);
            const cols = await databases.listCollections(dbId);
            
            for (const col of cols.collections) {
                console.log(`\nCollection: ${col.name} (${col.$id})`);
                const attrs = await databases.listAttributes(dbId, col.$id);
                console.log("  Attributes:", attrs.attributes.map(a => a.key));
                const indexes = await databases.listIndexes(dbId, col.$id);
                console.log("  Indexes:", indexes.indexes.map(i => `${i.key} [${i.attributes.join(',')}]`));
                
                try {
                    const docs = await databases.listDocuments(dbId, col.$id);
                    console.log(`  Documents count: ${docs.total}`);
                } catch (e) {
                    console.log(`  Documents Error: ${e.message}`);
                }
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

check();
