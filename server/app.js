require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file in parent directory

const express = require('express');
const multer = require("multer");
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const { analyzeImage } = require('./services/aiAnalysisService');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port or default

// MongoDB Configuration
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "hostilesDB"; 
let db;
let reportersCollection;
let reportsCollection;
let hostilePersonsCollection;
let cloudinaryImagesCollection;

// AI Analysis is now function-based (no initialization needed)

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!mongoUri) {
    console.error("MongoDB URI is not defined. Please set MONGODB_URI in your .env file.");
    process.exit(1);
}

async function connectToMongo() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db(dbName);
        
        // Initialize collections
        reportersCollection = db.collection('reporters');
        reportsCollection = db.collection('reports');
        hostilePersonsCollection = db.collection('hostile_persons');
        cloudinaryImagesCollection = db.collection('cloudinary_images');
        
        // Create indexes
        await createIndexes();
        
        console.log(`Successfully connected to MongoDB: ${dbName}`);
        console.log('Collections: reporters, reports, hostile_persons, cloudinary_images');
        console.log('AI Analysis functions ready');
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

async function createIndexes() {
    try {
        // Reporters indexes
        await reportersCollection.createIndex({ "reporterId": 1 }, { unique: true });
        await reportersCollection.createIndex({ "reporterPhone": 1 });
        await reportersCollection.createIndex({ "createdAt": -1 });
        
        // Reports indexes
        await reportsCollection.createIndex({ "reportId": 1 }, { unique: true });
        await reportsCollection.createIndex({ "reporterId": 1 });
        await reportsCollection.createIndex({ "hostileName": 1, "hostilePhone": 1 });
        await reportsCollection.createIndex({ "createdAt": -1 });
        
        // Hostile persons indexes
        await hostilePersonsCollection.createIndex({ "hostilePersonId": 1 }, { unique: true });
        await hostilePersonsCollection.createIndex({ "reportCount": -1 });
        await hostilePersonsCollection.createIndex({ 
            "name": "text", 
            "phone": "text", 
            "city": "text" 
        });
        
        console.log('Database indexes created successfully');
    } catch (err) {
        console.error('Error creating indexes:', err);
    }
}

// Utility functions
function generateReporterId() {
    return `RPT_${Date.now()}`;
}

function generateReportId() {
    return `REP_${Date.now()}`;
}

function generateImageId() {
    return `IMG_${Date.now()}`;
}

function generateHostilePersonId(name, phone) {
    const hash = crypto.createHash('sha256');
    hash.update(`${name.toLowerCase().trim()}_${phone.trim()}`);
    return `HST_${hash.digest('hex').substring(0, 16)}`;
}

// Express middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WEBP allowed.'));
        }
    }
});

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, '../client','home_page', 'index.html'));
});
app.get('/search', (req,res) => {
    res.sendFile(path.join(__dirname, '../client', 'search', 'index.html'));
});

app.get('/home_page', (req,res) => {
    res.sendFile(path.join(__dirname, '../client', 'home_page', 'index.html'));
});

app.get('/about', (req,res) => {
    res.sendFile(path.join(__dirname, '../client', 'about', 'index.html'));
});

app.get('/sign_in', (req,res) => {
    res.sendFile(path.join(__dirname, '../client', 'sign_in', 'index.html'));
});

app.get('/report', (req,res) => {
    res.sendFile(path.join(__dirname, '../client', 'report', 'index.html'));
});

// === NEW API ENDPOINTS ===

// Reporter Management
app.post('/api/reporters', async (req, res) => {
    try {
        const { reporterName, reporterPhone, reporterCity, reporterInstagram, reporterFacebook } = req.body;
        
        if (!reporterName || !reporterPhone || !reporterCity) {
            return res.status(400).json({ error: 'Name, phone, and city are required' });
        }
        
        const reporterId = generateReporterId();
        
        // Check if reporter exists (for count tracking)
        const existingReporter = await reportersCollection.findOne({
            reporterPhone: reporterPhone,
            reporterName: reporterName
        });
        
        const reportCount = existingReporter ? existingReporter.reportCount + 1 : 1;
        
        const reporterData = {
            reporterId,
            reporterName,
            reporterPhone,
            reporterCity,
            reporterInstagram: reporterInstagram || '',
            reporterFacebook: reporterFacebook || '',
            reportCount,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };
        
        await reportersCollection.insertOne(reporterData);
        
        res.status(201).json({ 
            success: true, 
            reporterId,
            message: 'Reporter session created successfully' 
        });
    } catch (error) {
        console.error('Error creating reporter:', error);
        res.status(500).json({ error: 'Failed to create reporter session' });
    }
});

app.get('/api/reporters/:reporterId', async (req, res) => {
    try {
        const { reporterId } = req.params;
        const reporter = await reportersCollection.findOne({ reporterId });
        
        if (!reporter) {
            return res.status(404).json({ error: 'Reporter not found' });
        }
        
        res.json({ reporter });
    } catch (error) {
        console.error('Error fetching reporter:', error);
        res.status(500).json({ error: 'Failed to fetch reporter' });
    }
});

// Image Upload with AI Analysis
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        const imageId = generateImageId();
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    public_id: imageId,
                    folder: 'safe-zone-evidence',
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });
        
        console.log(`Image uploaded to Cloudinary: ${result.secure_url}`);
        
        // Run AI Analysis on the uploaded image
        const aiAnalysis = await analyzeImage(result.secure_url);
        
        // Simple approval check
        const isApproved = aiAnalysis.success && aiAnalysis.isHostile;
        
        // Save basic image metadata
        const imageData = {
            imageId,
            cloudinaryPublicId: result.public_id,
            cloudinaryUrl: result.url,
            secureUrl: result.secure_url,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            dimensions: {
                width: result.width,
                height: result.height
            },
            uploadDate: new Date(),
            isActive: true,
            isApproved: isApproved
        };
        
        await cloudinaryImagesCollection.insertOne(imageData);
        
        console.log(`AI Analysis completed - Image ${isApproved ? 'APPROVED' : 'REJECTED'}`);
        
        res.json({
            success: true,
            imageId,
            imageUrl: result.secure_url,
            isApproved: isApproved,
            message: isApproved ? 
                'Image uploaded and approved as evidence' : 
                'Image uploaded but not approved as evidence'
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Report Management with AI Validation
app.post('/api/reports', async (req, res) => {
    try {
        const { 
            reporterId, 
            hostileName, 
            hostilePhone, 
            hostileCity, 
            hostileInstagram, 
            hostileFacebook,
            evidenceImageId 
        } = req.body;
        
        if (!reporterId || !hostileName || !hostilePhone || !hostileCity || !evidenceImageId) {
            return res.status(400).json({ error: 'All fields including evidence image are required' });
        }
        
        // Verify reporter exists
        const reporter = await reportersCollection.findOne({ reporterId });
        if (!reporter) {
            return res.status(404).json({ error: 'Invalid reporter session' });
        }
        
        // Verify image exists and check if approved
        const imageData = await cloudinaryImagesCollection.findOne({ imageId: evidenceImageId });
        if (!imageData) {
            return res.status(404).json({ error: 'Invalid image reference' });
        }
        
        // Simple validation: Only accept reports with approved evidence
        if (!imageData.isApproved) {
            return res.status(422).json({ 
                error: 'Evidence not approved',
                message: 'The uploaded image was not approved as evidence. Reports require approved evidence images.',
                code: 'EVIDENCE_NOT_APPROVED'
            });
        }
        
        console.log('Report submission approved - Evidence is approved');
        
        const reportId = generateReportId();
        
        // Create report
        const reportData = {
            reportId,
            reporterId,
            hostileName,
            hostilePhone,
            hostileCity,
            hostileInstagram: hostileInstagram || '',
            hostileFacebook: hostileFacebook || '',
            evidenceImageId,
            evidenceImageMetadata: {
                cloudinaryUrl: imageData.cloudinaryUrl,
                publicId: imageData.cloudinaryPublicId,
                uploadDate: imageData.uploadDate,
                fileType: imageData.fileType,
                fileSize: imageData.fileSize,
                originalName: imageData.originalName
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending'
        };
        
        await reportsCollection.insertOne(reportData);
        
        // Update image with report reference
        await cloudinaryImagesCollection.updateOne(
            { imageId: evidenceImageId },
            { 
                $set: { 
                    associatedReportId: reportId,
                    associatedReporterId: reporterId
                }
            }
        );
        
        // Update/Create hostile person entry
        await updateHostilePerson(reportData);
        
        res.status(201).json({
            success: true,
            reportId,
            message: 'Report submitted successfully'
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
});

async function updateHostilePerson(reportData) {
    const hostilePersonId = generateHostilePersonId(reportData.hostileName, reportData.hostilePhone);
    
    const existingPerson = await hostilePersonsCollection.findOne({ hostilePersonId });
    
    if (existingPerson) {
        // Update existing person
        await hostilePersonsCollection.updateOne(
            { hostilePersonId },
            {
                $inc: { reportCount: 1 },
                $set: { 
                    lastReportDate: reportData.createdAt,
                    latestEvidenceImage: reportData.evidenceImageMetadata,
                    updatedAt: new Date()
                },
                $push: { reportIds: reportData.reportId }
            }
        );
    } else {
        // Create new person
        const riskLevel = 'low'; // Will be updated based on report count
        
        const hostilePersonData = {
            hostilePersonId,
            name: reportData.hostileName,
            phone: reportData.hostilePhone,
            city: reportData.hostileCity,
            instagram: reportData.hostileInstagram,
            facebook: reportData.hostileFacebook,
            reportCount: 1,
            firstReportDate: reportData.createdAt,
            lastReportDate: reportData.createdAt,
            reportIds: [reportData.reportId],
            latestEvidenceImage: reportData.evidenceImageMetadata,
            verificationStatus: 'unverified',
            riskLevel,
            createdAt: reportData.createdAt,
            updatedAt: reportData.createdAt
        };
        
        await hostilePersonsCollection.insertOne(hostilePersonData);
    }
    
    // Update risk level based on report count
    const updatedPerson = await hostilePersonsCollection.findOne({ hostilePersonId });
    let riskLevel = 'low';
    if (updatedPerson.reportCount >= 5) riskLevel = 'high';
    else if (updatedPerson.reportCount >= 3) riskLevel = 'medium';
    
    await hostilePersonsCollection.updateOne(
        { hostilePersonId },
        { $set: { riskLevel } }
    );
}

// Hostile Persons (Display Table)
app.get('/api/hostile-persons', async (req, res) => {
    try {
        const hostilePersons = await hostilePersonsCollection
            .find({})
            .sort({ reportCount: -1, lastReportDate: -1 })
            .toArray();
        
        // Remove sensitive data before sending
        const sanitizedData = hostilePersons.map(person => ({
            name: person.name,
            phone: person.phone,
            city: person.city,
            instagram: person.instagram,
            facebook: person.facebook,
            reportCount: person.reportCount,
            lastReportDate: person.lastReportDate,
            latestEvidenceImage: person.latestEvidenceImage,
            verificationStatus: person.verificationStatus,
            riskLevel: person.riskLevel
        }));
        
        res.json({ hostilePersons: sanitizedData });
    } catch (error) {
        console.error('Error fetching hostile persons:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.get('/api/hostile-persons/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }
        
        const results = await hostilePersonsCollection
            .find({
                $text: { $search: q }
            })
            .sort({ reportCount: -1 })
            .toArray();
        
        const sanitizedData = results.map(person => ({
            name: person.name,
            phone: person.phone,
            city: person.city,
            instagram: person.instagram,
            facebook: person.facebook,
            reportCount: person.reportCount,
            lastReportDate: person.lastReportDate,
            latestEvidenceImage: person.latestEvidenceImage,
            verificationStatus: person.verificationStatus,
            riskLevel: person.riskLevel
        }));
        
        res.json({ results: sanitizedData });
    } catch (error) {
        console.error('Error searching hostile persons:', error);
        res.status(500).json({ error: 'Failed to search' });
    }
});

// AI Analysis Test Endpoint (for development/testing)
app.post('/api/test-ai-analysis', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }
        
        console.log(`Testing AI analysis for URL: ${imageUrl}`);
        const analysis = await analyzeImage(imageUrl);
        
        res.json({
            success: true,
            isApproved: analysis.success && analysis.isHostile,
            message: `Image analyzed - ${analysis.isHostile ? 'APPROVED' : 'NOT APPROVED'}`
        });
    } catch (error) {
        console.error('Error in AI analysis test:', error);
        res.status(500).json({ error: 'AI analysis test failed' });
    }
});

// Legacy compatibility (keeping for migration)
app.post('/save-data', async (req, res) => {
    // This endpoint is deprecated - redirect to new flow
    res.status(410).json({ 
        error: 'This endpoint is deprecated. Please use the new reporter flow.',
        redirectTo: '/sign_in'
    });
});

app.get('/get-data', async (req, res) => {
    // Redirect to new endpoint
    return res.redirect('/api/hostile-persons');
});

async function startServer() {
    await connectToMongo();
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        console.log(`Main page: http://localhost:${PORT}`);
        console.log(`Sign-in: http://localhost:${PORT}/sign_in`);
        console.log(`Search: http://localhost:${PORT}/search`);
        console.log(`About: http://localhost:${PORT}/about`);
        console.log(`Home page: http://localhost:${PORT}/home_page`);
    });
}

startServer();