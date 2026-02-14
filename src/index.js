import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use('/*', cors());

// Default route
app.get('/', (c) => c.text('LIB Backend is running on Cloudflare Workers!'));

// 1. GET ALL BOOKS
app.get('/api/books', async (c) => {
    try {
        const result = await c.env.DB.prepare('SELECT * FROM books ORDER BY id ASC').all();
        return c.json(result.results);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// 2. ADD A BOOK (Admin)
app.post('/api/books', async (c) => {
    const { title, author, stock, cover, shared_by } = await c.req.json();
    try {
        const result = await c.env.DB.prepare(
            'INSERT INTO books (title, author, stock, cover, shared_by) VALUES (?, ?, ?, ?, ?) RETURNING *'
        ).bind(title, author, stock, cover, shared_by).first();
        return c.json(result, 201);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// 3. EDIT A BOOK (Admin)
app.put('/api/books/:id', async (c) => {
    const id = c.req.param('id');
    const { title, author, stock, cover, shared_by } = await c.req.json();

    // Protect original 23 books logic (optional but good to keep consistent)
    if (parseInt(id) <= 23) {
        // We technically allow stock updates, but maybe we want to restrict full edits?
        // Retaining original logic: "Prevent editing original 23 books" (server.js line 160)
        return c.json({ error: "Cannot edit the original 23 books." }, 403);
    }

    try {
        const result = await c.env.DB.prepare(
            'UPDATE books SET title=?, author=?, stock=?, cover=?, shared_by=? WHERE id=? RETURNING *'
        ).bind(title, author, stock, cover, shared_by, id).first();
        return c.json(result);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// 4. GET ALL RENTALS
app.get('/api/rentals', async (c) => {
    try {
        const result = await c.env.DB.prepare('SELECT * FROM rentals').all();
        return c.json(result.results);
    } catch (err) {
        return c.json([], 500);
    }
});

// 5. CREATE RENTAL
app.post('/api/rentals', async (c) => {
    const { bookId, bookTitle, borrowerName, borrowerUid, rentDate, dueDate } = await c.req.json();
    try {
        const result = await c.env.DB.prepare(
            'INSERT INTO rentals (book_id, book_title, borrower_name, borrower_uid, rent_date, due_date) VALUES (?, ?, ?, ?, ?, ?) RETURNING rental_id'
        ).bind(bookId, bookTitle, borrowerName, borrowerUid, rentDate, dueDate).first();

        // Update Stock (Decrement)
        await c.env.DB.prepare('UPDATE books SET stock = stock - 1 WHERE id = ?').bind(bookId).run();

        return c.json({ message: 'Rental created', rentalId: result.rental_id }, 201);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// 6. RETURN BOOK
app.put('/api/rentals/:id/return', async (c) => {
    const rentalId = c.req.param('id');
    const returnDate = new Date().toISOString().split('T')[0];

    try {
        // 1. Get the rental to find the book_id
        const rental = await c.env.DB.prepare('SELECT book_id FROM rentals WHERE rental_id = ?').bind(rentalId).first();

        if (!rental) return c.json({ error: 'Rental not found' }, 404);

        // 2. Mark returned
        await c.env.DB.prepare(
            'UPDATE rentals SET return_date = ? WHERE rental_id = ?'
        ).bind(returnDate, rentalId).run();

        // 3. Increment Stock
        await c.env.DB.prepare('UPDATE books SET stock = stock + 1 WHERE id = ?').bind(rental.book_id).run();

        return c.json({ message: 'Book returned successfully' });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// 7. GET OVERDUE
app.get('/api/rentals/overdue', async (c) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const result = await c.env.DB.prepare(
            'SELECT * FROM rentals WHERE return_date IS NULL AND due_date < ?'
        ).bind(today).all();
        return c.json(result.results);
    } catch (err) {
        return c.json([]);
    }
});

export default app;
