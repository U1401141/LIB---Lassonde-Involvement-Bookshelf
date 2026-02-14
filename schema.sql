DROP TABLE IF EXISTS books;
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  stock INTEGER NOT NULL,
  cover TEXT,
  shared_by TEXT
);

DROP TABLE IF EXISTS rentals;
CREATE TABLE rentals (
  rental_id INTEGER PRIMARY KEY,
  book_id INTEGER NOT NULL,
  book_title TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_uid TEXT NOT NULL,
  rent_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT
);

-- Seed Initial 23 Books
INSERT INTO books (id, title, author, stock, cover) VALUES
(1, 'The Ultimate Blueprint for an Insanely Successful Business', 'Keith J. Cunningham', 1, 'Image/The%20Ultimate%20Blueprint%20for%20an%20Insanely%20Successful%20Business.jpg'),
(2, 'Atomic Habits', 'James Clear', 2, 'Image/Atomic%20Habits%20%E2%80%94%20James%20Clear.jpg'),
(3, 'The Psychology of Money', 'Morgan Housel', 2, 'Image/The%20Psychology%20of%20Money%20%E2%80%94%20Morgan%20Housel.jpg'),
(4, 'Act Like a Leader, Think Like a Leader', 'Herminia Ibarra', 1, 'Image/Act%20Like%20a%20Leader,%20Think%20Like%20a%20Leader%20%E2%80%94%20Herminia%20Ibarra.jpg'),
(5, 'Google Leaks', 'Zach Vorhies', 1, 'Image/Google%20Leaks%20%E2%80%94%20Zach%20Vorhies.jpg'),
(6, 'Find Your Why', 'Simon Sinek', 1, 'Image/Find%20Your%20Why%20%E2%80%94%20Simon%20Sinek.jpg'),
(7, 'Make Your Bed', 'Admiral William H. McRaven', 1, 'Image/Make%20Your%20Bed%20%E2%80%94%20Admiral%20William%20H.%20McRaven.jpg'),
(8, 'Start with Why', 'Simon Sinek', 1, 'Image/Start%20with%20Why%20%E2%80%94%20Simon%20Sinek.jpg'),
(9, 'Zero to One', 'Peter Thiel', 1, 'Image/Zero%20to%20One%20%E2%80%94%20Peter%20Thiel.jpg'),
(10, 'Tools of Titans', 'Timothy Ferriss', 1, 'Image/Tools%20of%20Titans%20%E2%80%94%20Timothy%20Ferriss.jpg'),
(11, 'Limitless', 'Jim Kwik', 1, 'Image/Limitless%20%E2%80%94%20Jim%20Kwik.jpg'),
(12, 'How to Win Friends & Influence People', 'Dale Carnegie', 1, 'Image/How%20to%20Win%20Friends%20&%20Influence%20People%20%E2%80%94%20Dale%20Carnegie.jpg'),
(13, 'Die with Zero', 'Bill Perkins', 1, 'Image/Die%20with%20Zero%20%E2%80%94%20Bill%20Perkins.jpg'),
(14, 'Rich Dad Poor Dad', 'Robert T. Kiyosaki', 1, 'Image/Rich%20Dad%20Poor%20Dad%20%E2%80%94%20Robert%20T.%20Kiyosaki.jpg'),
(15, 'Good to Great', 'Jim Collins', 1, 'Image/Good%20to%20Great%20%E2%80%94%20Jim%20Collins.jpg'),
(16, 'The 4-Hour Workweek', 'Timothy Ferriss', 1, 'Image/The%204-Hour%20Workweek%20%E2%80%94%20Timothy%20Ferriss.jpg'),
(17, 'Outliers', 'Malcolm Gladwell', 1, 'Image/Outliers%20%E2%80%94%20Malcolm%20Gladwell.jpg'),
(18, 'Thinking, Fast and Slow', 'Daniel Kahneman', 1, 'Image/Thinking,%20Fast%20and%20Slow%20%E2%80%94%20Daniel%20Kahneman.jpg'),
(19, 'The Power of Habit', 'Charles Duhigg', 1, 'Image/The%20Power%20of%20Habit%20%E2%80%94%20Charles%20Duhigg.jpg'),
(20, 'Deep Work', 'Cal Newport', 1, 'Image/Deep%20Work%20%E2%80%94%20Cal%20Newport.jpg'),
(21, 'Principles', 'Ray Dalio', 1, 'Image/Principles%20%E2%80%94%20Ray%20Dalio.jpg'),
(22, 'Sapiens', 'Yuval Noah Harari', 1, 'Image/Sapiens%20%E2%80%94%20Yuval%20Noah%20Harari.jpg'),
(23, 'Educated', 'Tara Westover', 1, 'Image/Educated%20%E2%80%94%20Tara%20Westover.jpg');
