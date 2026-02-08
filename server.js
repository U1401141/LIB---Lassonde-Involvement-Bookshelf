const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// --- Database Connection Strategy ---
let pool = null;
let dbAvailable = false;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    dbAvailable = true;
    console.log("Database configuration found. Attempting to connect...");
} else {
    console.warn("WARNING: No DATABASE_URL found. Running in MEMORY-ONLY mode.");
    console.warn("Rentals and new books will NOT be saved persistently.");
}

// Helper to safely execute queries
const safeQuery = async (text, params) => {
    if (!dbAvailable || !pool) {
        throw new Error("Database not available");
    }
    return await pool.query(text, params);
};

// Original Data (The 23 Books)
const INITIAL_BOOKS = [
    { title: 'The Ultimate Blueprint for an Insanely Successful Business', author: 'Keith J. Cunningham', stock: 1, cover: 'Image/The%20Ultimate%20Blueprint%20for%20an%20Insanely%20Successful%20Business.jpg' },
    { title: 'Atomic Habits', author: 'James Clear', stock: 2, cover: 'Image/Atomic%20Habits%20%E2%80%94%20James%20Clear.jpg' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', stock: 2, cover: 'Image/The%20Psychology%20of%20Money%20%E2%80%94%20Morgan%20Housel.jpg' },
    { title: 'Act Like a Leader, Think Like a Leader', author: 'Herminia Ibarra', stock: 1, cover: 'Image/Act%20Like%20a%20Leader,%20Think%20Like%20a%20Leader%20%E2%80%94%20Herminia%20Ibarra.jpg' },
    { title: 'Google Leaks', author: 'Zach Vorhies', stock: 1, cover: 'Image/Google%20Leaks%20%E2%80%94%20Zach%20Vorhies.jpg' },
    { title: 'Find Your Why', author: 'Simon Sinek', stock: 1, cover: 'Image/Find%20Your%20Why%20%E2%80%94%20Simon%20Sinek.jpg' },
    { title: 'Make Your Bed', author: 'Admiral William H. McRaven', stock: 1, cover: 'Image/Make%20Your%20Bed%20%E2%80%94%20Admiral%20William%20H.%20McRaven.jpg' },
    { title: 'Start with Why', author: 'Simon Sinek', stock: 1, cover: 'Image/Start%20with%20Why%20%E2%80%94%20Simon%20Sinek.jpg' },
    { title: 'Zero to One', author: 'Peter Thiel', stock: 1, cover: 'Image/Zero%20to%20One%20%E2%80%94%20Peter%20Thiel.jpg' },
    { title: 'Tools of Titans', author: 'Timothy Ferriss', stock: 1, cover: 'Image/Tools%20of%20Titans%20%E2%80%94%20Timothy%20Ferriss.jpg' },
    { title: 'Limitless', author: 'Jim Kwik', stock: 1, cover: 'Image/Limitless%20%E2%80%94%20Jim%20Kwik.jpg' },
    { title: 'How to Win Friends & Influence People', author: 'Dale Carnegie', stock: 1, cover: 'Image/How%20to%20Win%20Friends%20&%20Influence%20People%20%E2%80%94%20Dale%20Carnegie.jpg' },
    { title: 'Die with Zero', author: 'Bill Perkins', stock: 1, cover: 'Image/Die%20with%20Zero%20%E2%80%94%20Bill%20Perkins.jpg' },
    { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', stock: 1, cover: 'Image/Rich%20Dad%20Poor%20Dad%20%E2%80%94%20Robert%20T.%20Kiyosaki.jpg' },
    { title: 'Good to Great', author: 'Jim Collins', stock: 1, cover: 'Image/Good%20to%20Great%20%E2%80%94%20Jim%20Collins.jpg' },
    { title: 'The 4-Hour Workweek', author: 'Timothy Ferriss', stock: 1, cover: 'Image/The%204-Hour%20Workweek%20%E2%80%94%20Timothy%20Ferriss.jpg' },
    { title: 'Outliers', author: 'Malcolm Gladwell', stock: 1, cover: 'Image/Outliers%20%E2%80%94%20Malcolm%20Gladwell.jpg' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', stock: 1, cover: 'Image/Thinking,%20Fast%20and%20Slow%20%E2%80%94%20Daniel%20Kahneman.jpg' },
    { title: 'The Power of Habit', author: 'Charles Duhigg', stock: 1, cover: 'Image/The%20Power%20of%20Habit%20%E2%80%94%20Charles%20Duhigg.jpg' },
    { title: 'Deep Work', author: 'Cal Newport', stock: 1, cover: 'Image/Deep%20Work%20%E2%80%94%20Cal%20Newport.jpg' },
    { title: 'Principles', author: 'Ray Dalio', stock: 1, cover: 'Image/Principles%20%E2%80%94%20Ray%20Dalio.jpg' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', stock: 1, cover: 'Image/Sapiens%20%E2%80%94%20Yuval%20Noah%20Harari.jpg' },
    { title: 'Educated', author: 'Tara Westover', stock: 1, cover: 'Image/Educated%20%E2%80%94%20Tara%20Westover.jpg' }
];

// --- Database Initialization ---
const initDatabase = async () => {
    if (!dbAvailable) return;

    try {
        // Create Rentals Table
        await safeQuery(`CREATE TABLE IF NOT EXISTS rentals (
            rental_id SERIAL PRIMARY KEY,
            book_id INTEGER NOT NULL,
            book_title TEXT NOT NULL,
            borrower_name TEXT NOT NULL,
            borrower_uid TEXT NOT NULL,
            rent_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            return_date TEXT
        )`);

        // Create Books Table
        await safeQuery(`CREATE TABLE IF NOT EXISTS books (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            stock INTEGER NOT NULL,
            cover TEXT,
            shared_by TEXT
        )`);

        // Ensure ID sequence starts after 23
        await safeQuery("SELECT setval(pg_get_serial_sequence('books', 'id'), 23, true)");

        console.log('Tables initialized. Database Active.');
    } catch (err) {
        console.error('Database connection failed on init:', err.message);
        // We do NOT set dbAvailable = false here, because it might be a transient connection issue.
        // But the queries below will fail safely.
    }
};

// Start Database Init
initDatabase();

// --- API Endpoints ---

// 1. GET ALL BOOKS (Hybrid: Static 23 + DB Books)
app.get('/api/books', async (req, res) => {
    // 1. Static Books (IDs 1-23)
    const staticBooks = INITIAL_BOOKS.map((book, index) => ({
        id: index + 1,
        ...book
    }));

    try {
        if (dbAvailable) {
            // 2. Fetch DB Books (Only IDs > 23)
            const result = await safeQuery('SELECT * FROM books WHERE id > 23 ORDER BY id ASC');
            const dbBooks = result.rows;

            // 3. Merge
            res.json([...staticBooks, ...dbBooks]);
        } else {
            console.log('DB unavailable. Returning static books only.');
            res.json(staticBooks);
        }
    } catch (err) {
        console.error('Error fetching books from DB (Fallback active):', err.message);
        res.json(staticBooks);
    }
});

// 2. ADD A BOOK (For Admin)
app.post('/api/books', async (req, res) => {
    if (!dbAvailable) return res.status(503).json({ error: "Database unavailable. Cannot add books." });

    const { title, author, stock, cover, shared_by } = req.body;
    try {
        const result = await safeQuery(
            'INSERT INTO books (title, author, stock, cover, shared_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, author, stock, cover, shared_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error adding book' });
    }
});

// 3. EDIT A BOOK (For Admin)
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, stock, cover, shared_by } = req.body;

    // PROTECTION: Prevent editing original 23 books
    if (parseInt(id, 10) <= 23) {
        return res.status(403).json({ error: "Cannot edit the original 23 books." });
    }

    if (!dbAvailable) return res.status(503).json({ error: "Database unavailable. Cannot edit books." });

    try {
        const result = await safeQuery(
            'UPDATE books SET title=$1, author=$2, stock=$3, cover=$4, shared_by=$5 WHERE id=$6 RETURNING *',
            [title, author, stock, cover, shared_by, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error updating book' });
    }
});

// 4. GET ALL RENTALS
app.get('/api/rentals', async (req, res) => {
    if (!dbAvailable) return res.json([]); // Return empty list transparently

    try {
        const result = await safeQuery('SELECT * FROM rentals');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching rentals (returning empty list):", err.message);
        res.json([]);
    }
});

// 5. CREATE RENTAL
app.post('/api/rentals', async (req, res) => {
    if (!dbAvailable) return res.status(503).json({ error: "Database unavailable. Cannot rent." });

    const { bookId, bookTitle, borrowerName, borrowerUid, rentDate, dueDate } = req.body;
    try {
        const result = await safeQuery(
            'INSERT INTO rentals (book_id, book_title, borrower_name, borrower_uid, rent_date, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING rental_id',
            [bookId, bookTitle, borrowerName, borrowerUid, rentDate, dueDate]
        );
        res.status(201).json({ message: 'Rental created', rentalId: result.rows[0].rental_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 6. RETURN BOOK
app.put('/api/rentals/:id/return', async (req, res) => {
    if (!dbAvailable) return res.status(503).json({ error: "Database unavailable. Cannot return." });

    const rentalId = req.params.id;
    const return_date = new Date().toISOString().split('T')[0];
    try {
        const result = await safeQuery(
            'UPDATE rentals SET return_date = $1 WHERE rental_id = $2',
            [return_date, rentalId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Rental not found' });
        res.json({ message: 'Book returned successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 6a. DELETE RENTAL
app.delete('/api/rentals/:id', async (req, res) => {
    if (!dbAvailable) return res.status(503).json({ error: "Database unavailable." });

    const rentalId = req.params.id;
    try {
        const result = await safeQuery('DELETE FROM rentals WHERE rental_id = $1', [rentalId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Rental not found' });
        res.json({ message: 'Rental record deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 7. GET OVERDUE
app.get('/api/rentals/overdue', async (req, res) => {
    if (!dbAvailable) return res.json([]);

    const today = new Date().toISOString().split('T')[0];
    try {
        const result = await safeQuery(
            'SELECT * FROM rentals WHERE return_date IS NULL AND due_date < $1',
            [today]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!dbAvailable) {
        console.log("NOTE: Database is NOT configured. App running in static mode.");
    }
});