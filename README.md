# Safe Zone - מזהה מספרי טלפון חשודים

🛡️ פלטפורמה לזיהוי ודיווח על מספרי טלפון של אנשים עוינים למניעת זיהוי מוטעה

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [תכונות עיקריות](#תכונות-עיקריות)
- [טכנולוגיות](#טכנולוגיות)
- [התקנה](#התקנה)
- [הגדרת סביבת העבודה](#הגדרת-סביבת-העבודה)
- [הרצת הפרויקט](#הרצת-הפרויקט)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [API Endpoints](#api-endpoints)
- [תמיכה](#תמיכה)

## 🎯 סקירה כללית

Safe Zone הוא אתר אינטרנט שמסייע בזיהוי מספרי טלפון של אנשים עוינים. המערכת מאפשרת למשתמשים לחפש מספרי טלפון במאגר נתונים, לדווח על מספרים חשודים, ולקבל מידע אמין על מספרי טלפון שונים.

האתר נבנה כדי למנוע טעויות בזיהוי ולשפר את הדיוק והבטיחות בסביבת העבודה או בחיי היומיום.

## ✨ תכונות עיקריות

- 🔍 **חיפוש מהיר** - בדיקת מספרי טלפון במאגר הנתונים
- 📝 **דיווח על מספרים חשודים** - הוספת מספרים חדשים למאגר
- 📊 **דוחות ומידע** - צפייה בסטטיסטיקות ודוחות
- 🛡️ **מאגר מתעדכן** - מידע מהימן המתעדכן כל הזמן
- 📱 **עיצוב רספונסיבי** - פועל על כל המכשירים
- 🗂️ **העלאת תמונות** - אפשרות להעלות תמונות הקשורות לדיווחים

## 🛠️ טכנולוגיות

### Backend
- **Node.js** - סביבת הרצה
- **Express.js** - מסגרת שרת
- **MongoDB** - מאגר נתונים
- **Multer** - העלאת קבצים
- **CORS** - תמיכה בבקשות חוצות דומיינים
- **dotenv** - ניהול משתני סביבה

### Frontend
- **HTML5** - מבנה הדפים
- **CSS3** - עיצוב וסטיילינג
- **JavaScript** - פונקציונליות צד לקוח
- **עיצוב רספונסיבי** - תמיכה במכשירים שונים

## 📦 התקנה

### דרישות מקדימות
- Node.js (גרסה 14 ומעלה)
- MongoDB (מקומי או Atlas)
- Git

### שלבי ההתקנה

1. **שכפול הפרויקט**
```bash
git clone https://github.com/tamirblu/Safe-Zone.git
cd Safe-Zone
```

2. **התקנת התלויות**
```bash
npm install
```

3. **יצירת תיקיית uploads**
```bash
mkdir uploads
```

## ⚙️ הגדרת סביבת העבודה

צור קובץ `.env` בשורש הפרויקט עם המשתנים הבאים:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/your-database-name
# או עבור MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Database Settings
DB_NAME=hostilesDB
COLLECTION_NAME=hostile

# Server Settings
PORT=3000

# Security (אופציונלי)
NODE_ENV=development
```

### הגדרת MongoDB

#### MongoDB מקומי:
1. התקן MongoDB במחשב שלך
2. הרץ את שירות MongoDB
3. השתמש ב-URI: `mongodb://localhost:27017/hostilesDB`

#### MongoDB Atlas (ענן):
1. צור חשבון ב-[MongoDB Atlas](https://www.mongodb.com/atlas)
2. צור Cluster חדש
3. קבל את connection string ושים אותו ב-`MONGODB_URI`

## 🚀 הרצת הפרויקט

### הרצה רגילה
```bash
npm start
```

### הרצה עם nodemon (למפתחים)
```bash
npm install -g nodemon
nodemon app.js
```

האתר יהיה זמין בכתובת: `http://localhost:3000`

## 📁 מבנה הפרויקט

```
Safe-Zone/
├── 📁 home_page/          # דף הבית
│   └── index.html
├── 📁 search/             # דף החיפוש
│   └── index.html
├── 📁 sign_in/            # דף הוספת דיווח
│   └── index.html
├── 📁 report/             # דף הדוחות
│   └── index.html
├── 📁 about/              # דף אודות
│   └── index.html
├── 📁 uploads/            # תמונות שהועלו
├── 📁 node_modules/       # תלויות NPM
├── 📄 app.js              # שרת ראשי
├── 📄 style.css           # עיצוב גלובלי
├── 📄 package.json        # הגדרות הפרויקט
├── 📄 data.json           # נתונים מקומיים (deprecated)
├── 📄 .gitignore          # קבצים להתעלמות
├── 📄 .env                # משתני סביבה (לא במאגר)
└── 📄 README.md           # המדריך הזה
```

## 🔌 API Endpoints

### GET Routes
- `GET /` - דף הבית
- `GET /home_page` - דף הבית
- `GET /search` - דף החיפוש
- `GET /about` - דף אודות
- `GET /gallery` - גלריית משתמשים (legacy)
- `GET /get-data` - קבלת כל הנתונים מ-MongoDB

### POST Routes
- `POST /save-data` - שמירת נתונים חדשים ל-MongoDB
- `POST /hostile` - הוספת משתמש עם תמונה (legacy)

### דוגמת שימוש ב-API

**שמירת נתונים:**
```javascript
fetch('/save-data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        phoneNumber: '052-1234567',
        name: 'שם החשוד',
        description: 'תיאור הבעיה',
        location: 'מיקום',
        reportedBy: 'שם המדווח'
    })
})
```

**קבלת נתונים:**
```javascript
fetch('/get-data')
    .then(response => response.json())
    .then(data => console.log(data.hostile))
```

## 🔒 אבטחה ופרטיות

- משתני הסביבה נשמרים בקובץ `.env` ולא נמצאים במאגר
- העלאת תמונות מוגבלת לתיקייה מוגדרת
- שימוש ב-CORS לבקרת גישה
- ולידציה של נתונים נכנסים

## 🤝 תמיכה ופתרון בעיות

### בעיות נפוצות

**שגיאת חיבור למאגר נתונים:**
```
Failed to connect to MongoDB
```
**פתרון:** בדוק שה-MongoDB רץ ושה-`MONGODB_URI` נכון

**שגיאת PORT:**
```
Error: listen EADDRINUSE
```
**פתרון:** שנה את הפורט ב-`.env` או סגור תהליכים אחרים

**תמונות לא נטענות:**
**פתרון:** וודא שתיקיית `uploads` קיימת והרשאות נכונות

### לוגים ודיבוג
השרת מציג מידע שימושי בקונסול:
- סטטוס חיבור למאגר נתונים
- פורט השרת
- קישורים לדפים עיקריים

## 📝 רישיון

פרויקט זה מיועד למטרות חינוכיות ופיתוח. אנא השתמש באחריות ובהתאם לחוקי הפרטיות המקומיים.

---

**נוצר על ידי:** Safe Zone Team  
**גרסה:** 1.0.0  
**עדכון אחרון:** 2024

לשאלות ותמיכה, אנא פנו דרך Issues בגיטהאב. 