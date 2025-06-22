# AI Integration Setup Guide

## Overview
The AI analysis system has been integrated into the Safe Zone reporting pipeline using a function-based approach. Reports now require AI-validated evidence to be accepted.

## How It Works

### 1. Image Upload Flow
```
User uploads image → Cloudinary → AI Analysis → Result stored in DB
```

### 2. Report Submission Flow
```
User submits report → Check image AI analysis → Accept/Reject based on hostility
```

### 3. AI Analysis Process
- **Step 1**: GPT-4 Vision analyzes the image content
- **Step 2**: OpenAI Moderation API checks for hostility
- **Step 3**: Threshold-based classification (hostile/not hostile)

### 4. Architecture
- **Function-based design**: No classes or instances, just functions
- **Auto-initialization**: OpenAI client initialized on first use
- **Modular approach**: Each function handles specific analysis tasks

## Required Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key

# Existing variables (make sure these are set)
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## API Endpoints

### Image Upload with AI Analysis
```
POST /api/images/upload
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "imageId": "IMG_123456789",
  "imageUrl": "https://res.cloudinary.com/...",
  "isApproved": true,
  "message": "Image uploaded and approved as evidence"
}
```

### Report Submission (AI-Gated)
```
POST /api/reports
Content-Type: application/json

Body:
{
  "reporterId": "RPT_123",
  "hostileName": "Name",
  "hostilePhone": "123-456-7890",
  "hostileCity": "City",
  "evidenceImageId": "IMG_123456789"
}
```

**Success Response** (if evidence is hostile):
```json
{
  "success": true,
  "reportId": "REP_123456789",
  "message": "Report submitted successfully"
}
```

**Rejection Response** (if evidence is not approved):
```json
{
  "error": "Evidence not approved",
  "message": "The uploaded image was not approved as evidence. Reports require approved evidence images.",
  "code": "EVIDENCE_NOT_APPROVED"
}
```

### Test AI Analysis
```
POST /api/test-ai-analysis
Content-Type: application/json

Body:
{
  "imageUrl": "https://example.com/image.jpg"
}

Response:
{
  "success": true,
  "isApproved": false,
  "message": "Image analyzed - NOT APPROVED"
}
```

## Database Schema Updates

### Images Collection
```javascript
{
  imageId: "IMG_123",
  // ... existing fields
  isApproved: true // Simple boolean: true = approved, false = not approved
}
```

## Hostility Detection

### Threshold
- **Current threshold**: 0.0001
- **Categories checked**: hate, harassment, violence, threats

### Classification Logic
- **Hostile**: Any category score > threshold
- **Not Hostile**: All category scores ≤ threshold

## Error Handling

### Common Error Codes
- `EVIDENCE_NOT_APPROVED`: Image was not approved as evidence

### Fallback Behavior
- If AI analysis fails, image is marked as not approved
- Reports with non-approved images are rejected
- System logs approval/rejection decisions

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables** in `.env` file

3. **Test the integration**:
```bash
curl -X POST http://localhost:3000/api/test-ai-analysis \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/test-image.jpg"}'
```

## Monitoring

The system logs:
- AI analysis start/completion
- Hostility detection results
- Report approval/rejection decisions
- Error conditions

Check console output for detailed AI analysis logging. 