# Safe-Zone Setup Guide

## Environment Variables Setup

Create a `.env` file in the root directory with the following configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
# Or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=hostilesDB

# Cloudinary Configuration  
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=3000
```

## Cloudinary Setup

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Copy the following values to your `.env` file:
   - Cloud Name
   - API Key
   - API Secret

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at [mongodb.com](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Replace in `.env` file

## Running the Application

```bash
# Install dependencies
npm install

# Start the server
npm start
# or
node app.js
```

## Testing the Flow

1. **Sign In**: Go to `http://localhost:3000/sign_in`
   - Fill reporter information
   - Click "המשך לדיווח"
   - Should redirect to report page with URL parameter

2. **Report**: Complete the form at `/report?reporterId=xxx`
   - Fill hostile person information
   - Upload evidence image
   - Submit report

3. **Search**: View results at `http://localhost:3000/search`
   - Should show aggregated data with report counts
   - Evidence images displayed
   - Risk levels indicated

## Database Collections

The system automatically creates these MongoDB collections:

- `reporters` - Reporter sessions
- `reports` - Individual reports  
- `hostile_persons` - Aggregated display data
- `cloudinary_images` - Image metadata

## Features Implemented ✅

- ✅ Session-based reporter tracking
- ✅ Anonymous reporting with ID linking
- ✅ Cloudinary image upload and storage
- ✅ Report count aggregation  
- ✅ Risk level calculation
- ✅ Complete reporter anonymity in display
- ✅ Evidence image display in search results
- ✅ Duplicate hostile person detection
- ✅ Responsive UI with Hebrew support

## Security Features

- Complete reporter anonymity in public display
- Session-based IDs that don't reveal personal information
- Image validation and size limits
- Required evidence photos for all reports
- Israeli phone number validation 