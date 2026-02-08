const { useState, useEffect } = React;

/* --- Constants & Utils --- */
const MAX_RENTAL_DAYS = 14;

const getDaysRented = (dateStringOrTimestamp) => {
  if (!dateStringOrTimestamp) return 0;
  // If numeric timestamp
  if (typeof dateStringOrTimestamp === 'number') {
    const diff = Date.now() - dateStringOrTimestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  // If string YYYY-MM-DD
  const rentDate = new Date(dateStringOrTimestamp);
  const diff = Date.now() - rentDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatUID = (uid) => uid.toLowerCase();

/* --- Components --- */

// Modal Component
const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay">
    <div className="modal">
      <button className="modal-close" onClick={onClose}>
        <span className="material-icons">close</span>
      </button>
      <h2 className="modal-title">{title}</h2>
      {children}
    </div>
  </div>
);

// Rent Modal
const RentModal = ({ book, onClose, onConfirm }) => {
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Validation: u + 7 digits
    const uidRegex = /^u\d{7}$/;
    if (!uidRegex.test(uid)) {
      setError('UID must start with "u" followed by 7 digits (e.g., u1234567)');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!confirmed) {
      setError('You must accept the rental terms');
      return;
    }
    onConfirm(uid, name);
  };

  return (
    <Modal title={`Checkout "${book.title}"`} onClose={onClose}>
      <div className="form-group">
        <label>UID (e.g. u1401141)</label>
        <input
          className="form-input"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="u1234567"
          maxLength={8}
        />
      </div>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Full Name</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kento Nohara"
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I understand that this book can only be rented for 14 days.
        </label>
      </div>

      {error && <p className="error-msg" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-confirm btn-rent-confirm" onClick={handleSubmit}>Checkout Book</button>
      </div>
    </Modal>
  );
};

// Return Modal
const ReturnModal = ({ book, rental, onClose, onConfirm }) => {
  const [uidCorrect, setUidCorrect] = useState(false);
  const [conditionGood, setConditionGood] = useState(false);

  const canConfirm = uidCorrect && conditionGood;

  return (
    <Modal title="Return Confirmation" onClose={onClose}>
      <p style={{ marginBottom: '1rem' }}>
        Returning: <strong>{book.title}</strong><br />
        Checked out by: <strong>{rental.borrower_uid}</strong>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={uidCorrect}
            onChange={(e) => setUidCorrect(e.target.checked)}
          />
          Was the user UID correct?
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={conditionGood}
            onChange={(e) => setConditionGood(e.target.checked)}
          />
          Is the book in good condition?
        </label>
      </div>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className="btn-confirm btn-return-confirm"
          disabled={!canConfirm}
          onClick={onConfirm}
        >
          Confirm Return
        </button>
      </div>
    </Modal>
  );
};

// Overdue Modal
const OverdueModal = ({ overdueRentals, onClose, onConfirm }) => {
  const [checked, setChecked] = useState(false);

  return (
    <Modal title="Overdue Rentals Alert" onClose={onClose}>
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
        {overdueRentals.map((item, idx) => (
          <div key={idx} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <strong>UID: {item.rental.borrower_uid}</strong><br />
            Book: {item.book.title}<br />
            <span style={{ color: 'var(--color-danger)' }}>Overdue by {getDaysRented(item.rental.due_date) * -1} days</span>
          </div>
        ))}
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        I have reviewed this information
      </label>

      <div className="modal-actions">
        <button
          className="btn-confirm"
          disabled={!checked}
          onClick={() => { onClose(); onConfirm(); }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

// History Modal
const HistoryModal = ({ book, rentals, onClose, onDelete }) => {
  return (
    <Modal title={`History: ${book.title}`} onClose={onClose}>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px' }}>Date</th>
              <th style={{ padding: '8px' }}>Borrower</th>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => (
              <tr key={rental.rental_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{rental.rent_date.split('T')[0]}</td>
                <td style={{ padding: '8px' }}>
                  {rental.borrower_name}<br />
                  <small style={{ color: '#666' }}>{rental.borrower_uid}</small>
                </td>
                <td style={{ padding: '8px' }}>
                  {rental.return_date ? <span style={{ color: 'green' }}>Returned</span> : <span style={{ color: 'orange' }}>Active</span>}
                </td>
                <td style={{ padding: '8px' }}>
                  {onDelete && (
                    <button
                      className="btn-return-sm"
                      style={{ backgroundColor: '#ff4444', color: 'white' }}
                      onClick={() => onDelete(rental.rental_id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rentals.length === 0 && <p style={{ padding: '1rem', textAlign: 'center' }}>No history found.</p>}
      </div>
    </Modal>
  );
};

// Edit/Add Book Modal
const BookEditorModal = ({ book, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    stock: 1,
    cover: '',
    shared_by: ''
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        stock: book.stock,
        cover: book.cover,
        shared_by: book.shared_by || ''
      });
    }
  }, [book]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Modal title={book ? 'Edit Book' : 'Add New Book'} onClose={onClose}>
      <div className="form-group">
        <label>Title</label>
        <input className="form-input" name="title" value={formData.title} onChange={handleChange} />
      </div>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Author</label>
        <input className="form-input" name="author" value={formData.author} onChange={handleChange} />
      </div>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Stock</label>
        <input className="form-input" type="number" name="stock" value={formData.stock} onChange={handleChange} />
      </div>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Cover URL</label>
        <input className="form-input" name="cover" value={formData.cover} onChange={handleChange} />
      </div>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Shared By (Optional)</label>
        <input className="form-input" name="shared_by" value={formData.shared_by} onChange={handleChange} />
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-confirm" onClick={handleSubmit}>Save</button>
      </div>
    </Modal>
  );
};

// Book Card
const BookCard = ({ book, role, onRent, onReturn, onViewHistory, onEdit }) => {
  const activeRentals = book.rentals.filter(r => !r.return_date);
  const availableStock = book.stock - activeRentals.length;
  const isAvailable = availableStock > 0;

  // Sort rentals by rent_date desc
  const sortedRentals = [...book.rentals].sort((a, b) => new Date(b.rent_date) - new Date(a.rent_date));
  const lastRental = sortedRentals[0];

  return (
    <div className="book-card" style={{ position: 'relative' }}>
      {role === 'ADMIN' && (
        <button
          className="btn-edit-book"
          style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', zIndex: 10 }}
          onClick={() => onEdit(book)}
        >
          Edit
        </button>
      )}
      <div className="book-cover-container">
        <img src={book.cover} alt={book.title} className="book-cover" />
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>

        <div className="book-stock">Stock: {availableStock} / {book.stock}</div>

        {book.shared_by && (
          <div className="book-shared-by" style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>
            Shared by: {book.shared_by}
          </div>
        )}

        {/* Recently Rented By Section */}
        {lastRental && (
          <div className="recently-rented">
            <span className="label">Last checked out by:</span>
            <span className="value">{lastRental.borrower_name} ({lastRental.borrower_uid})</span>
            <div className="date">{lastRental.rent_date.split('T')[0]}</div>
          </div>
        )}

        <div className="book-actions">
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {isAvailable && (
              <button className="btn-rent" style={{ flex: 1 }} onClick={() => onRent(book)}>
                Checkout
              </button>
            )}
            <button className="btn-secondary" style={{ padding: '0 12px' }} onClick={() => onViewHistory(book)}>
              ...
            </button>
          </div>

          {activeRentals.map((rental, idx) => {
            const days = getDaysRented(rental.rent_date);
            const isOverdue = days > MAX_RENTAL_DAYS;
            return (
              <div key={idx} className="rented-info">
                <div className="rented-info-row">
                  <span>
                    <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }}>person</span>
                    {rental.borrower_uid}
                  </span>
                  {isOverdue && <span className="overdue-warning">!</span>}
                </div>
                <div className="rented-info-row">
                  <span>{days} days</span>
                  {role === 'ADMIN' && (
                    <button
                      className="btn-return-sm"
                      onClick={() => onReturn(book, rental)}
                    >
                      Return
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Add Book Card
const AddBookCard = ({ onClick }) => (
  <div
    className="book-card"
    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', minHeight: '400px' }}
    onClick={onClick}
  >
    <div style={{ textAlign: 'center', color: '#ccc' }}>
      <span className="material-icons" style={{ fontSize: '64px' }}>add</span>
      <h3>Add Book</h3>
    </div>
  </div>
);

// Main App
const App = () => {
  const [view, setView] = useState('LOGIN'); // LOGIN, USER, ADMIN
  const [books, setBooks] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [rentingBook, setRentingBook] = useState(null);
  const [returningData, setReturningData] = useState(null); // { book, rental }
  const [historyBook, setHistoryBook] = useState(null); // Book to show history for
  const [showOverdue, setShowOverdue] = useState(false);
  const [overdueList, setOverdueList] = useState([]);
  const [editingBook, setEditingBook] = useState(null); // Book to edit (or 'NEW' for adding)

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch books and rentals in parallel
      const [booksRes, rentalsRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/rentals')
      ]);

      if (!booksRes.ok || !rentalsRes.ok) throw new Error('Failed to fetch data');

      const booksData = await booksRes.json();
      const rentalsData = await rentalsRes.json();

      // Merge rentals into books
      const mergedBooks = booksData.map(book => {
        const bookRentals = rentalsData.filter(r => r.book_id === book.id);
        return {
          ...book,
          rentals: bookRentals
        };
      });

      setBooks(mergedBooks);
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback or error state?
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actions
  const handleRent = async (uid, name) => {
    if (!rentingBook) return;

    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: rentingBook.id,
          book_title: rentingBook.title,
          borrower_name: name,
          borrower_uid: formatUID(uid),
          rental_duration: MAX_RENTAL_DAYS
        })
      });

      if (response.ok) {
        await fetchData();
        setRentingBook(null);
      } else {
        alert("Error renting book");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  const handleReturn = async () => {
    if (!returningData) return;
    const { rental } = returningData;

    try {
      const response = await fetch(`/api/rentals/${rental.rental_id}/return`, {
        method: 'PUT'
      });

      if (response.ok) {
        await fetchData();
        setReturningData(null);
      } else {
        alert("Error returning book");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  const handleDeleteRental = async (rentalId) => {
    if (!confirm("Are you sure you want to delete this rental record?")) return;
    try {
      const response = await fetch(`/api/rentals/${rentalId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchData();
        // Close history modal if open to refresh state
        setHistoryBook(null);
      } else {
        alert("Error deleting record");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBook = async (bookData) => {
    try {
      let response;
      if (editingBook === 'NEW') {
        response = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      } else {
        response = await fetch(`/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      }

      if (response.ok) {
        await fetchData();
        setEditingBook(null);
      } else {
        alert("Error saving book");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  // Check overdue for Admin
  const checkOverdue = async () => {
    try {
      const response = await fetch('/api/rentals/overdue');
      const overdueRentals = await response.json();

      if (overdueRentals.length > 0) {
        // Map overdue rentals to include book info for display
        const formatted = overdueRentals.map(r => ({
          rental: r,
          book: { title: r.book_title }
        }));
        setOverdueList(formatted);
        setShowOverdue(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setView('ADMIN');
    checkOverdue();
  };

  // Views
  if (view === 'LOGIN') {
    return (
      <div className="login-screen">
        <h1 className="login-title">LIB</h1>
        <div className="login-options">
          <div className="card-option" onClick={() => setView('USER')}>
            <span className="material-icons large-icon">person_outline</span>
            <h3>User</h3>
          </div>
          <div className="card-option" onClick={() => setView('ADMIN_LOGIN')}>
            <span className="material-icons large-icon">admin_panel_settings</span>
            <h3>Administrator</h3>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'ADMIN_LOGIN') {
    return <AdminLogin onLogin={handleAdminLogin} onBack={() => setView('LOGIN')} />;
  }

  // Find updated history book from books state
  const activeHistoryBook = historyBook ? books.find(b => b.id === historyBook.id) : null;

  return (
    <div className="container">
      <header className="header">
        <div className="logo">LIB <span style={{ fontWeight: '400', color: '#64748b' }}>| {isAdmin ? 'Administrator' : 'User'}</span></div>
        <button className="btn-logout" onClick={() => {
          setView('LOGIN');
          setIsAdmin(false);
          setShowOverdue(false);
          setEditingBook(null);
        }}>
          Exit
        </button>
      </header>

      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}

      <div className="book-grid">
        {books.map(book => (
          <BookCard
            key={book.id}
            book={book}
            role={isAdmin ? 'ADMIN' : 'USER'}
            onRent={(b) => setRentingBook(b)}
            onReturn={(b, r) => setReturningData({ book: b, rental: r })}
            onViewHistory={(b) => setHistoryBook(b)}
            onEdit={(b) => setEditingBook(b)}
          />
        ))}
        {isAdmin && <AddBookCard onClick={() => setEditingBook('NEW')} />}
      </div>

      {rentingBook && (
        <RentModal
          book={rentingBook}
          onClose={() => setRentingBook(null)}
          onConfirm={handleRent}
        />
      )}

      {returningData && (
        <ReturnModal
          book={returningData.book}
          rental={returningData.rental}
          onClose={() => setReturningData(null)}
          onConfirm={handleReturn}
        />
      )}

      {historyBook && activeHistoryBook && (
        <HistoryModal
          book={activeHistoryBook}
          rentals={activeHistoryBook.rentals}
          onClose={() => setHistoryBook(null)}
          onDelete={isAdmin ? handleDeleteRental : null}
        />
      )}

      {showOverdue && (
        <OverdueModal
          overdueRentals={overdueList}
          onClose={() => setShowOverdue(false)}
          onConfirm={() => { }}
        />
      )}

      {editingBook && (
        <BookEditorModal
          book={editingBook === 'NEW' ? null : editingBook}
          onClose={() => setEditingBook(null)}
          onSave={handleSaveBook}
        />
      )}
    </div>
  );
};

// Admin Login Form Component
const AdminLogin = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'Admin_LIB' && password === 'Lassonde!46') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-screen">
      <h1 className="login-title">Admin Access</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            className="form-input"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-confirm" type="submit">Login</button>
        <div className="back-link" onClick={onBack}>Back to Home</div>
      </form>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
