// Data migration script for Safe-Zone
// Migrates data from old 'hostile' collection to new structure
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

async function migrateData() {
    console.log('🔄 Starting Safe-Zone Data Migration...\n');
    
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in environment variables');
        return;
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME || 'hostilesDB');
        
        // Check if old collection exists
        const collections = await db.listCollections({ name: 'hostile' }).toArray();
        if (collections.length === 0) {
            console.log('⚠️  No "hostile" collection found. Migration not needed.');
            return;
        }
        
        const oldCollection = db.collection('hostile');
        const hostilePersonsCollection = db.collection('hostile_persons');
        
        // Get old data
        const oldData = await oldCollection.find({}).toArray();
        console.log(`📊 Found ${oldData.length} records in old collection`);
        
        if (oldData.length === 0) {
            console.log('ℹ️  No data to migrate');
            return;
        }
        
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const oldRecord of oldData) {
            try {
                // Generate hostile person ID based on name + phone
                const name = oldRecord.UserName || 'Unknown';
                const phone = oldRecord.UserTeam || 'Unknown';
                const city = oldRecord.UserTEARIM || 'Unknown';
                const instagram = oldRecord.UserPosition || '';
                const facebook = oldRecord.UserFace || '';
                
                const hostilePersonId = generateHostilePersonId(name, phone);
                
                // Check if this person already exists
                const existingPerson = await hostilePersonsCollection.findOne({ hostilePersonId });
                
                if (existingPerson) {
                    // Update existing person (increment count)
                    await hostilePersonsCollection.updateOne(
                        { hostilePersonId },
                        {
                            $inc: { reportCount: 1 },
                            $set: { 
                                lastReportDate: oldRecord.submissionDate ? new Date(oldRecord.submissionDate) : new Date(),
                                updatedAt: new Date()
                            },
                            $push: { reportIds: `MIGRATED_${oldRecord.id || oldRecord._id}` }
                        }
                    );
                    skippedCount++;
                    console.log(`   ⬆️  Updated existing person: ${name}`);
                } else {
                    // Create new person
                    const hostilePersonData = {
                        hostilePersonId,
                        name,
                        phone,
                        city,
                        instagram,
                        facebook,
                        reportCount: 1,
                        firstReportDate: oldRecord.submissionDate ? new Date(oldRecord.submissionDate) : new Date(),
                        lastReportDate: oldRecord.submissionDate ? new Date(oldRecord.submissionDate) : new Date(),
                        reportIds: [`MIGRATED_${oldRecord.id || oldRecord._id}`],
                        latestEvidenceImage: null, // No images in old structure
                        verificationStatus: 'unverified',
                        riskLevel: 'low',
                        createdAt: oldRecord.submissionDate ? new Date(oldRecord.submissionDate) : new Date(),
                        updatedAt: new Date()
                    };
                    
                    await hostilePersonsCollection.insertOne(hostilePersonData);
                    migratedCount++;
                    console.log(`   ✅ Migrated: ${name} (${phone})`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error migrating record ${oldRecord.id || oldRecord._id}:`, error.message);
            }
        }
        
        // Update risk levels based on report counts
        console.log('\n🎯 Updating risk levels...');
        const allPersons = await hostilePersonsCollection.find({}).toArray();
        
        for (const person of allPersons) {
            let riskLevel = 'low';
            if (person.reportCount >= 5) riskLevel = 'high';
            else if (person.reportCount >= 3) riskLevel = 'medium';
            
            if (person.riskLevel !== riskLevel) {
                await hostilePersonsCollection.updateOne(
                    { _id: person._id },
                    { $set: { riskLevel } }
                );
            }
        }
        
        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ New records created: ${migratedCount}`);
        console.log(`   ⬆️  Existing records updated: ${skippedCount}`);
        console.log(`   📊 Total processed: ${oldData.length}`);
        
        // Ask if user wants to backup/remove old collection
        console.log('\n💾 Migration completed successfully!');
        console.log('   ⚠️  The old "hostile" collection still exists.');
        console.log('   ℹ️  You can safely remove it after verifying the migration.');
        console.log('   📝 To remove: db.hostile.drop() in MongoDB shell');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.close();
    }
}

function generateHostilePersonId(name, phone) {
    const hash = crypto.createHash('sha256');
    hash.update(`${name.toLowerCase().trim()}_${phone.trim()}`);
    return `HST_${hash.digest('hex').substring(0, 16)}`;
}

// Allow running as standalone script
if (require.main === module) {
    migrateData()
        .then(() => {
            console.log('\n🎉 Migration process completed.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateData }; 