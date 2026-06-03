import { Client, Databases, ID } from "node-appwrite";

// 1. Core Configuration
const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') // Locked to your Singapore region
    .setProject('6a1d47300008fc65d5c1')            // <-- PASTE PROJECT ID HERE
    .setKey('standard_68d598017415fbeb20c1a7f1017bd104a3d6318470c45fcce427705baaae002e0ab153a4db28ec52feaa917b2b8fd310a8f68c53884bcb506bf65d762833eeff654fb88c5147b725b37a0aa1829a5d3b175a84085abf70951f32f7da22e6384248d9683cabfb4d206ae6b624993794dd5bf091295b411a87dc2ced891b3d6882');                    // <-- PASTE SECRET API KEY HERE

const databases = new Databases(client);

// Extracted directly from your Appwrite screenshot URL
const DATABASE_ID = '6a1d47b3002eaafca63b';
const COLLECTION_ID = 'community_feed';

const mockThreatData = [
    { region_tag: "Rajkot_Rural", disease_name: "Tomato Late Blight", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { region_tag: "Gondal_Outskirts", disease_name: "Bacterial Spot", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { region_tag: "Morbi_Farms", disease_name: "Early Blight", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() }
];

async function executeInfrastructureAsCode() {
    console.log("[*] Commencing Infrastructure as Code Protocol...");

    try {
        // Phase 1: Force Create the Collection
        console.log("[*] Phase 1: Building Collection...");
        await databases.createCollection(DATABASE_ID, COLLECTION_ID, 'Community Feed');
        
        // Phase 2: Force Create Exact Attribute Keys
        console.log("[*] Phase 2: Injecting Strict Schema Attributes...");
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'region_tag', 100, true);
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'disease_name', 100, true);
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'timestamp', 100, true);
        
        console.log("[*] Waiting 5 seconds for Appwrite Engine to compile columns...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Phase 3: Ingest the Data
        console.log("[*] Phase 3: Seeding Network Intelligence Data...");
        for (const data of mockThreatData) {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data);
            console.log(`[+] Ingested: ${data.disease_name}`);
        }
        
        console.log("\n===============================================");
        console.log("[*] SUCCESS: DATABASE FULLY OPERATIONAL");
        console.log("===============================================");

    } catch (error) {
        console.error("\n[!] PIPELINE FAILURE:", error.message);
    }
}

executeInfrastructureAsCode();