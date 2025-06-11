require('dotenv').config(); // Load environment variables from .env file at the very top

const express = require('express');
const multer = require("multer");
const path = require('path');
// const fs = require("fs").promises; // No longer needed if data.json is fully deprecated
// const fsSync = require("fs"); // No longer needed if hostile.json is fully deprecated
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port or default

// MongoDB Configuration - Loaded from .env
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "hostilesDB"; 
const collectionName = process.env.COLLECTION_NAME || "hostile";
let db;
let hostileCollection;
// hostile
// reporter
if (!mongoUri) {
    console.error("MongoDB URI is not defined. Please set MONGODB_URI in your .env file.");
    process.exit(1);
}

async function connectToMongo() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db(dbName);
        hostileCollection = db.collection(collectionName);
        console.log(`Successfully connected to MongoDB: ${dbName}/${collectionName}`);
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1); // Exit if DB connection fails
    }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const Storage = multer.diskStorage({
    destination: function (req,file,cd) {
        cd(null, path.join(__dirname, 'uploads'))
    },
    filename: (req,file,cd)=> {
        cd(null, file.originalname);
    }
});
const upload = multer({ storage: Storage});

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/search', (req,res) => {
    res.sendFile(path.join(__dirname, 'search', 'index.html'));
});

app.get('/home_page', (req,res) => {
    res.sendFile(path.join(__dirname, 'home_page', 'index.html'));
});

app.get('/about', (req,res) => {
    res.sendFile(path.join(__dirname, 'about', 'index.html'));
});

app.post('/hostile' , upload.single('Userimage'), (req, res) => {
    const { UserName, UserTeam, UserTEARIM, UserGol, UserPosition } = req.body;
    const filePath = req.file ? req.file.filename : null;
    // This part still uses fsSync and hostile.json. 
    // If this is to be kept, ensure fsSync is required.
    // Otherwise, this route should be updated or removed.
    try {
        const fsSync = require("fs"); // Re-require if this block is kept
        const data = fsSync.readFileSync('hostile.json');
        const hostile = JSON.parse(data);
        const newUser = {
            name: UserName,
            team: UserTeam,
            tearim: UserTEARIM,
            gol: UserGol,
            position: UserPosition,
            image: filePath
        };
        hostile.push(newUser);
        fsSync.writeFileSync('hostile.json', JSON.stringify(hostile, null, 2));
        res.redirect('/gallery');
    } catch (err) {
        console.error("Error handling /hostile post:", err);
        res.status(500).send("Error processing request");
    }
});

app.get('/gallery', (req, res) => {
    let fileData;
    // This part still uses fsSync and hostile.json. 
    try {
        const fsSync = require("fs"); // Re-require if this block is kept
        fileData = fsSync.readFileSync('hostile.json', 'utf8');
    } catch (err) {
        fileData = '[]';
    }
    const hostile = JSON.parse(fileData);

    // בנייה דינאמית של עמוד HTML
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8"/>
        <title>גלריית שחקני כדורגל</title>
        <style>
        .card-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        .card {
            width: 200px;
            border: 1px solid #ccc;
            padding: 10px;
        }
        .card img {
            width: 100%;
            height: auto;
        }
        </style>
    </head>
    <body>
        <h1>גלריית שחקני כדורגל</h1>
        <div class="card-container">
    `;

    // יצירת כרטיסייה לכל שחקן
    hostile.forEach(User => {
        html += `
        <div class="card">
            <img src="/uploads/${User.image}" alt="${User.name}">
            <h2>${User.name}</h2>
            <p>מספר טלפון: ${User.team}</p>
            <p>אינסטגרם: ${User.position}</p>
            <p>עיר: ${User.tearim}</p>
            <p>פייסבוק: ${User.Face || 'לא צוין'}</p>
        </div>
        `;
    });

    html += `
        </div>
        <p><a href="/">להוספת שחקן חדש</a></p>
    </body>
    </html>
    `;

    res.send(html);
});

app.post('/save-data', async (req, res) => {
    if (!hostileCollection) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const UserData = req.body;
        UserData.createdAt = new Date();
        const result = await hostileCollection.insertOne(UserData);
        res.status(201).json({ success: true, message: 'Data saved successfully', insertedId: result.insertedId });
    } catch (error) {
        console.error('Error saving data to MongoDB:', error);
        res.status(500).json({ error: 'Failed to save data: ' + error.message });
    }
});

app.get('/get-data', async (req, res) => {
    if (!hostileCollection) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    try {
        const allhostile = await hostileCollection.find({}).toArray();
        res.json({ hostile: allhostile });
    } catch (error) {
        console.error('Error reading data from MongoDB:', error);
        res.status(500).json({ error: 'Failed to read data: ' + error.message });
    }
});

async function startServer() {
    await connectToMongo();
    app.listen(PORT,() =>{
        console.log(`Server listening on port ${PORT}`);
        console.log(`Data will be saved to MongoDB: ${dbName}/${collectionName}`);
        console.log(`Main page: http://localhost:${PORT}`);
        console.log(`Search page: http://localhost:${PORT}/search`);
    });
}

startServer();