import { Client, Databases, ID } from "node-appwrite";

// 1. Initialize the Appwrite Server SDK
const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') 
    .setProject('6a1d47300008fc65d5c1')               // <-- PASTE PROJECT ID HERE
    .setKey('standard_68d598017415fbeb20c1a7f1017bd104a3d6318470c45fcce427705baaae002e0ab153a4db28ec52feaa917b2b8fd310a8f68c53884bcb506bf65d762833eeff654fb88c5147b725b37a0aa1829a5d3b175a84085abf70951f32f7da22e6384248d9683cabfb4d206ae6b624993794dd5bf091295b411a87dc2ced891b3d6882');                // <-- PASTE SECRET API KEY HERE

const databases = new Databases(client);

// 2. Target your Database and Collection
const DATABASE_ID = '6a1d47b3002eaafca63b';
const COLLECTION_ID = 'diagnostic_logs';

// 3. The Mock Intelligence Data
const mockThreatData = [
    {
        region_tag: "Rajkot_Rural",
        disease_name: "Tomato Late Blight",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
    },
    {
        region_tag: "Gondal_Outskirts",
        disease_name: "Bacterial Spot",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    },
    {
        region_tag: "Morbi_Farms",
        disease_name: "Early Blight",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
        region_tag: "Rajkot_Rural",
        disease_name: "Powdery Mildew",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    }
];

// 4. The Execution Function
async function seedDatabase() {
    console.log("[*] Initializing Database Seeding Protocol...");
    try {
        for (const data of mockThreatData) {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                data
            );
            console.log(`[+] Ingested threat event: ${data.disease_name} in ${data.region_tag}`);
        }
        console.log("[*] SUCCESS: Mock database seeded. Refresh your React app.");
    } catch (error) {
        console.error("[!] FATAL ERROR during seeding:", error.message);
    }
}

seedDatabase();