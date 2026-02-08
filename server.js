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

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Original Data for Seeding
const INITIAL_BOOKS = [
    { title: 'The Ultimate Blueprint for an Insanely Successful Business', author: 'Keith J. Cunningham', stock: 1, cover: 'Image/The%20Ultimate%20Blueprint%20for%20an%20Insanely%20Successful%20Business.jpg' },
    { title: 'Atomic Habits', author: 'James Clear', stock: 2, cover: 'Image/Atomic%20Habits%20%E2%80%94%20James%20Clear.jpg' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', stock: 2, cover: 'Image/The%20Psychology%20of%20Money%20%E2%80%94%20Morgan%20Housel.jpg' },
    { title: 'Act Like a Leader, Think Like a Leader', author: 'Herminia Ibarra', stock: 1, cover: 'Image/Act%20Like%20a%20Leader%2C%20Think%20Like%20a%20Leader%20%E2%80%94%20Herminia%20Ibarra.jpg' },
    { title: 'Give and Take', author: 'Adam Grant', stock: 3, cover: 'Image/Give%20and%20Take%20%E2%80%94%20Adam%20Grant.jpg' },
    { title: 'Where Good Ideas Come From', author: 'Steven Johnson', stock: 2, cover: 'Image/Where%20Good%20Ideas%20Come%20From%20%E2%80%94%20Steven%20Johnson.jpg' },
    { title: 'The Old Man and the Sea', author: 'Ernest Hemingway', stock: 1, cover: 'Image/The%20Old%20Man%20and%20the%20Sea%20%E2%80%94%20Ernest%20Hemingway.jpg' },
    { title: 'Digital Empires', author: 'Anu Bradford', stock: 1, cover: 'Image/Digital%20Empires%20%E2%80%94%20Anu%20Bradford.jpg' },
    { title: 'Let’s Get Real or Let’s Not Play', author: 'Mahan Khalsa & Randy Illig', stock: 1, cover: 'Image/Let%E2%80%99s%20Get%20Real%20or%20Let%E2%80%99s%20Not%20Play%20%E2%80%94%20Mahan%20Khalsa%20%26%20Randy%20Illig.jpg' },
    { title: 'The Seasons of a Man’s Life', author: 'Daniel Levinson', stock: 1, cover: 'Image/The%20Seasons%20of%20a%20Man%E2%80%99s%20Life%20%E2%80%94%20Daniel%20Levinson.jpg' },
    { title: 'The One Thing', author: 'Gary Keller & Jay Papasan', stock: 1, cover: 'Image/The%20One%20Thing%20%E2%80%94%20Gary%20Keller%20%26%20Jay%20Papasan.jpg' },
    { title: 'The Innovator’s Dilemma', author: 'Clayton Christensen', stock: 2, cover: 'Image/The%20Innovator%E2%80%99s%20Dilemma%20%E2%80%94%20Clayton%20Christensen.jpg' },
    { title: 'The Richest Man in Babylon', author: 'George S. Clason', stock: 3, cover: 'Image/The%20Richest%20Man%20in%20Babylon%20%E2%80%94%20George%20S.%20Clason.jpg' },
    { title: 'The Greatest Salesman in the World', author: 'Og Mandino', stock: 2, cover: 'Image/The%20Greatest%20Salesman%20in%20the%20World%20%E2%80%94%20Og%20Mandino.jpg' },
    { title: 'Think and Grow Rich', author: 'Napoleon Hill', stock: 3, cover: 'Image/Think%20and%20Grow%20Rich%20%E2%80%94%20Napoleon%20Hill.jpg' },
    { title: 'Skeletons on the Zahara', author: 'Dean King', stock: 1, cover: 'Image/Skeletons%20on%20the%20Zahara%20%E2%80%94%20Dean%20King.jpg' },
    { title: 'The Intelligent Investor', author: 'Benjamin Graham', stock: 1, cover: 'Image/The%20Intelligent%20Investor%20%E2%80%94%20Benjamin%20Graham.jpg' },
    { title: 'The Divine Comedy', author: 'Dante Alighieri', stock: 1, cover: 'Image/The%20Divine%20Comedy%20%E2%80%94%20Dante%20Alighieri.jpg' },
    { title: 'Data Science for Business', author: 'Foster Provost & Tom Fawcett', stock: 1, cover: 'Image/Data%20Science%20for%20Business%20%E2%80%94%20Foster%20Provost%20%26%20Tom%20Fawcett.jpg' },
    { title: 'Everett Ruess: A Vagabond for Beauty', author: 'W. L. Rusho', stock: 1, cover: 'Image/Everett%20Ruess%20A%20Vagabond%20for%20Beauty%20-%20W.%20L.%20Rusho.jpg' },
    { title: 'The Art of Seduction', author: 'Robert Greene', stock: 1, cover: 'Image/The%20Art%20of%20Seduction%20%E2%80%94%20Robert%20Greene.jpg' },
    { title: 'The War of Art', author: 'Steven Pressfield', stock: 2, cover: 'Image/The%20War%20of%20Art%20%E2%80%94%20Steven%20Pressfield.jpg' },
    { title: 'Zen and the Art of Motorcycle Maintenance', author: 'Robert M. Pirsig', stock: 1, cover: 'Image/Zen%20and%20the%20Art%20of%20Motorcycle%20Maintenance%20%E2%80%94%20Robert%20M.%20Pirsig.jpg' }
];

// Initialize Database
const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                stock INTEGER NOT NULL,
                cover TEXT,
                shared_by TEXT
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS rentals (
                rental_id SERIAL PRIMARY KEY,
                book_id INTEGER REFERENCES books(id),
                book_title TEXT NOT NULL,
                borrower_name TEXT NOT NULL,
                borrower_uid TEXT NOT NULL,
                rent_date DATE NOT NULL,
                due_date DATE NOT NULL,
                return_date DATE
            );
        `);
        console.log('Tables created successfully.');
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

const seedDatabase = async () => {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM books');
        const count = parseInt(res.rows[0].count);

        if (count === 0) {
            console.log('Table is empty. Seeding initial books...');
            for (const book of INITIAL_BOOKS) {
                await pool.query(
                    'INSERT INTO books (title, author, stock, cover) VALUES ($1, $2, $3, $4)',
                    [book.title, book.author, book.stock, book.cover]
                );
            }
            console.log('Database seeded with 23 initial books');
        } else {
            console.log('Books already exist. Skipping seed.');
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
};

const initDatabase = async () => {
    await createTables();
    await seedDatabase();
};

initDatabase();

// --- API Endpoints ---

// GET /api/books
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/books (Admin Add Book)
app.post('/api/books', async (req, res) => {
    const { title, author, stock, cover, shared_by } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO books (title, author, stock, cover, shared_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, author, stock, cover, shared_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/books/:id (Admin Edit Book)
app.put('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, stock, cover, shared_by } = req.body;
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, stock = $3, cover = $4, shared_by = $5 WHERE id = $6 RETURNING *',
            [title, author, stock, cover, shared_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/rentals
app.get('/api/rentals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rentals ORDER BY rent_date DESC, rental_id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/rentals/overdue
app.get('/api/rentals/overdue', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        // Find rentals where return_date is NULL and due_date < today
        // Note: dates in Postgres are YYYY-MM-DD by default when cast to text or using built-in date types
        const result = await pool.query(
            'SELECT * FROM rentals WHERE return_date IS NULL AND due_date < $1',
            [today]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/rentals
app.post('/api/rentals', async (req, res) => {
    const { book_id, book_title, borrower_name, borrower_uid, rental_duration } = req.body;

    const rentDateObj = new Date();
    const rent_date = rentDateObj.toISOString().split('T')[0];

    const dueDateObj = new Date(rentDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + (rental_duration || 14));
    const due_date = dueDateObj.toISOString().split('T')[0];

    try {
        const result = await pool.query(
            `INSERT INTO rentals (book_id, book_title, borrower_name, borrower_uid, rent_date, due_date)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING rental_id`,
            [book_id, book_title, borrower_name, borrower_uid, rent_date, due_date]
        );
        res.status(201).json({ message: 'Rental created', rentalId: result.rows[0].rental_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/rentals/:id/return
app.put('/api/rentals/:id/return', async (req, res) => {
    const rentalId = req.params.id;
    const return_date = new Date().toISOString().split('T')[0];

    try {
        const result = await pool.query(
            'UPDATE rentals SET return_date = $1 WHERE rental_id = $2',
            [return_date, rentalId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }
        res.json({ message: 'Book returned successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/rentals/:id
app.delete('/api/rentals/:id', async (req, res) => {
    const rentalId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM rentals WHERE rental_id = $1', [rentalId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }
        res.json({ message: 'Rental record deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
