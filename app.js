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
  <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-content">
      <div className="modal-header">
        <h2>{title}</h2>
      </div>
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
      <div className="form-group">
        <label>Full Name</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kento Nohara"
        />
      </div>

      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span style={{ fontSize: '0.9rem' }}>I understand that this book can only be rented for 14 days.</span>
        </label>
      </div>

      {error && <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit}>Checkout Book</button>
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
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
        <p style={{ margin: '0.5rem 0' }}>Returning: <strong>{book.title}</strong></p>
        <p style={{ margin: '0.5rem 0' }}>Checked out by: <strong>{rental.borrower_uid}</strong></p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={uidCorrect}
            onChange={(e) => setUidCorrect(e.target.checked)}
          />
          Was the user UID correct?
        </label>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={conditionGood}
            onChange={(e) => setConditionGood(e.target.checked)}
          />
          Is the book in good condition?
        </label>
      </div>

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!canConfirm}
          style={{ opacity: canConfirm ? 1 : 0.5 }}
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
          <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
            <strong>UID: {item.rental.borrower_uid}</strong><br />
            <span style={{ fontSize: '0.9rem' }}>{item.book.title}</span><br />
            <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: '600' }}>
              Overdue by {getDaysRented(item.rental.due_date) * -1} days
            </span>
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        I have reviewed this information
      </label>

      <div className="modal-actions">
        <button
          className="btn btn-primary"
          disabled={!checked}
          style={{ opacity: checked ? 1 : 0.5 }}
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', color: '#64748b' }}>
              <th style={{ padding: '8px' }}>Date</th>
              <th style={{ padding: '8px' }}>Borrower</th>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => (
              <tr key={rental.rental_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 8px' }}>{rental.rent_date.split('T')[0]}</td>
                <td style={{ padding: '12px 8px' }}>
                  {rental.borrower_name}<br />
                  <small style={{ color: '#94a3b8' }}>{rental.borrower_uid}</small>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {rental.return_date ?
                    <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>Returned</span> :
                    <span style={{ color: 'var(--color-primary)', fontWeight: '500' }}>Active</span>}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {onDelete && (
                    <button
                      className="btn"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: 'var(--color-danger)', color: 'white' }}
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
        {rentals.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No rental history found.</p>}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
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
      <div className="form-group">
        <label>Author</label>
        <input className="form-input" name="author" value={formData.author} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Stock</label>
        <input className="form-input" type="number" name="stock" value={formData.stock} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Cover URL</label>
        <input className="form-input" name="cover" value={formData.cover} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Shared By (Optional)</label>
        <input className="form-input" name="shared_by" value={formData.shared_by} onChange={handleChange} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
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
    <div className="book-card">
      <div className="book-cover-container">
        <img src={book.cover} alt={book.title} className="book-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/150x220?text=No+Cover'} />
      </div>

      <div className="book-card-content">
        <div>
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">{book.author}</p>
        </div>

        {book.shared_by && (
          <div className="book-shared-by" style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
            Shared by: {book.shared_by}
          </div>
        )}

        <div className="book-status">
          <span className={`stock-badge ${isAvailable ? 'available' : 'out'}`}>
            {isAvailable ? `${availableStock} Available` : 'Out of Stock'}
          </span>
          {role === 'ADMIN' && (
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => onEdit(book)}>Edit</button>
          )}
        </div>

        {/* Admin Views: show recent rental info inline */}
        {role === 'ADMIN' && lastRental && !lastRental.return_date && (
          <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}>
            <div style={{ fontWeight: '600', color: '#64748b' }}>Current Borrower:</div>
            <div>{lastRental.borrower_name}</div>
            <div style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{lastRental.borrower_uid}</div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isAvailable && (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onRent(book)}>
                Checkout
              </button>
            )}
            <button className="btn btn-ghost" style={{ padding: '0.75rem' }} onClick={() => onViewHistory(book)}>
              <span className="material-icons" style={{ fontSize: '1.2rem' }}>history</span>
            </button>
          </div>

          {/* Return Actions for Admin or user if we wanted to show them */}
          {activeRentals.map((rental, idx) => {
            const days = getDaysRented(rental.rent_date);
            const isOverdue = days > MAX_RENTAL_DAYS;
            if (!isOverdue && role !== 'ADMIN') return null; // Only show overdue warnings to users? Or maybe nothing

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: isOverdue ? '#fef2f2' : '#f0f9ff', padding: '0.5rem', borderRadius: '4px' }}>
                <span style={{ fontWeight: '500' }}>
                  {rental.borrower_uid} ({days}d)
                  {isOverdue && <span style={{ marginLeft: '4px', color: 'red' }}>!</span>}
                </span>
                {role === 'ADMIN' && (
                  <button
                    className="btn"
                    style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--color-primary)', color: 'white' }}
                    onClick={() => onReturn(book, rental)}
                  >
                    Return
                  </button>
                )}
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
    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', minHeight: '300px', border: '2px dashed #cbd5e1', boxShadow: 'none', background: 'transparent' }}
    onClick={onClick}
  >
    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
      <span className="material-icons" style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}>add_circle_outline</span>
      <h3 style={{ fontSize: '1.2rem' }}>Add New Book</h3>
    </div>
  </div>
);

// Main App component
const App = () => {
  const [view, setView] = useState('LANDING'); // LANDING, USER, ADMIN_LOGIN, ADMIN
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

  const [error, setError] = useState(null);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real Worker environment, these are relative paths
      const booksRes = await fetch('/api/books');

      // We also need rentals to merge availability
      const rentalsRes = await fetch('/api/rentals');

      if (!booksRes.ok) throw new Error(`Failed to fetch books`);
      // rentals fetch might fail if rentals table empty or not set up? No, should return empty array.

      const booksData = await booksRes.json();
      const rentalsData = await rentalsRes.json();

      // Merge rentals into books
      const mergedBooks = booksData.map(book => {
        const bookRentals = Array.isArray(rentalsData) ? rentalsData.filter(r => r.book_id === book.id) : [];
        return {
          ...book,
          rentals: bookRentals
        };
      });

      setBooks(mergedBooks);
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback for demo if backend isn't running
      setError("Waiting for backend...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'USER' || view === 'ADMIN') {
      fetchData();
    }
  }, [view]);

  // Actions
  const handleRent = async (uid, name) => {
    if (!rentingBook) return;

    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: rentingBook.id,
          bookTitle: rentingBook.title,
          borrowerName: name,
          borrowerUid: formatUID(uid),
          rentDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + MAX_RENTAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
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
    // Implement delete if API supports it, otherwise just return
    // Note: The proposed backend doesn't have an explicit DELETE rental endpoint separate from Return
    // but the old app did. I'll stick to Return for now unless I add DELETE to index.js
    console.log("Delete not fully implemented in this version, using Return flow preferred.");
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
        // The API returns the rental object. We need to match with books to get title if not in rental object
        // The D1 schema saves book_title in rentals table, so we are good.
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
  if (view === 'LANDING') {
    return (
      <div className="landing-screen">
        <img src="Image/LIB_Logo.png" alt="LIB Logo" className="logo-image logo-image-large" />
        <h1 className="app-title">Lassonde Involvement Bookshelf</h1>

        <div className="role-selection">
          <div className="role-card" onClick={() => setView('USER')}>
            <div className="role-title">User</div>
          </div>
          <div className="role-card" onClick={() => setView('ADMIN_LOGIN')}>
            <div className="role-title">Admin</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'ADMIN_LOGIN') {
    return (
      <div className="landing-screen">
        <img src="Image/LIB_Logo.png" alt="LIB Logo" className="logo-image logo-image-large" />
        <h2 className="app-title">Admin Access</h2>
        <AdminLogin onLogin={handleAdminLogin} onBack={() => setView('LANDING')} />
      </div>
    );
  }

  // Find updated history book from books state
  const activeHistoryBook = historyBook ? books.find(b => b.id === historyBook.id) : null;

  return (
    <div className="container">
      <header className="header">
        <div className="header-title">
          <img src="Image/LIB_Logo.png" alt="LIB Logo" className="logo-image" style={{ width: '40px', height: '40px' }} />
          <span>{isAdmin ? 'Administrator' : 'User'} View</span>
        </div>
        <button className="btn btn-ghost" onClick={() => {
          setView('LANDING');
          setIsAdmin(false);
          setShowOverdue(false);
          setEditingBook(null);
        }}>
          Exit
        </button>
      </header>

      {loading && <div className="text-center" style={{ padding: '20px' }}>Loading Bookshelf...</div>}
      {error && <div className="text-center" style={{ padding: '20px', color: 'var(--color-danger)' }}>{error}</div>}

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
    <form className="login-form" onSubmit={handleSubmit}>
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
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-ghost" type="button" onClick={onBack} style={{ flex: 1 }}>Back</button>
        <button className="btn btn-primary" type="submit" style={{ flex: 2 }}>Login</button>
      </div>
    </form>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
