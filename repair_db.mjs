import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') 
    .setProject('6a1d47300008fc65d5c1')
    .setKey('standard_68d598017415fbeb20c1a7f1017bd104a3d6318470c45fcce427705baaae002e0ab153a4db28ec52feaa917b2b8fd310a8f68c53884bcb506bf65d762833eeff654fb88c5147b725b37a0aa1829a5d3b175a84085abf70951f32f7da22e6384248d9683cabfb4d206ae6b624993794dd5bf091295b411a87dc2ced891b3d6882');

const databases = new Databases(client);
const dbId = '6a1d47b3002eaafca63b';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAttribute(colId, attrKey) {
    let available = false;
    let attempts = 0;
    while (!available && attempts < 20) {
        const attrs = await databases.listAttributes(dbId, colId);
        const attr = attrs.attributes.find(a => a.key === attrKey);
        if (attr && attr.status === 'available') {
            available = true;
            console.log(`Attribute ${attrKey} in ${colId} is now available!`);
        } else {
            console.log(`Waiting for attribute ${attrKey} in ${colId}... (status: ${attr ? attr.status : 'not found'})`);
            await delay(1500);
            attempts++;
        }
    }
    if (!available) throw new Error(`Attribute ${attrKey} failed to become available.`);
}

async function ensureAttribute(colId, attrKey, type, size = 255) {
    const attrs = await databases.listAttributes(dbId, colId);
    if (!attrs.attributes.some(a => a.key === attrKey)) {
        console.log(`Creating attribute ${attrKey} in ${colId}...`);
        if (type === 'string') {
            await databases.createStringAttribute(dbId, colId, attrKey, size, false);
        } else if (type === 'float') {
            await databases.createFloatAttribute(dbId, colId, attrKey, false);
        }
        await waitForAttribute(colId, attrKey);
    } else {
        console.log(`Attribute ${attrKey} already exists in ${colId}.`);
    }
}

async function createIndexes() {
    try {
        console.log("=== Repairing userimages ===");
        await ensureAttribute('userimages', 'user_id', 'string');
        try {
            await databases.createIndex(dbId, 'userimages', 'idx_user_id', 'key', ['user_id'], ['ASC']);
            console.log("Created user_id index on userimages.");
        } catch (e) { console.log(e.message); }

        console.log("\n=== Repairing farms ===");
        await ensureAttribute('farms', 'user_id', 'string');
        try {
            await databases.createIndex(dbId, 'farms', 'idx_user_id', 'key', ['user_id'], ['ASC']);
            console.log("Created user_id index on farms.");
        } catch (e) { console.log(e.message); }

        console.log("\n=== Repairing diagnostic_logs ===");
        // For diagnostic_logs, we need user_id, farm_id, disease, confidence, image_id, timestamp
        await ensureAttribute('diagnostic_logs', 'user_id', 'string');
        await ensureAttribute('diagnostic_logs', 'farm_id', 'string');
        await ensureAttribute('diagnostic_logs', 'disease', 'string');
        await ensureAttribute('diagnostic_logs', 'confidence', 'float');
        await ensureAttribute('diagnostic_logs', 'image_id', 'string');
        await ensureAttribute('diagnostic_logs', 'timestamp', 'string');

        try {
            await databases.createIndex(dbId, 'diagnostic_logs', 'idx_user_id', 'key', ['user_id'], ['ASC']);
            console.log("Created user_id index on diagnostic_logs.");
        } catch (e) { console.log(e.message); }

        console.log("\n✅ ALL REPAIRS COMPLETED SUCCESSFULLY!");

    } catch (err) {
        console.error("FATAL ERROR:", err.message);
    }
}

createIndexes();
