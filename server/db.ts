import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'smart_expense.db');

export function getDb(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  initSchema(db);
  return db;
}

function initSchema(db: DatabaseSync) {
  // Enable foreign keys and create tables
  db.exec(`PRAGMA foreign_keys = ON;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category_type TEXT NOT NULL CHECK (category_type IN ('Income', 'Expense')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name, category_type)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      category_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER, -- NULL means overall monthly budget
      amount REAL NOT NULL CHECK (amount > 0),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);
}

export function seedDemoData(db: DatabaseSync) {
  // Check if demo user exists
  const checkUser = db.prepare(`SELECT id FROM users WHERE email = ?;`);
  const existingUser = checkUser.get('demo@tracker.com') as { id: number } | undefined;

  let userId: number;
  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES (?, ?, ?, ?);
    `);
    const res = insertUser.run('demouser', 'demo@tracker.com', passwordHash, 'Rahul Sharma');
    userId = Number(res.lastInsertRowid);
  } else {
    userId = existingUser.id;
    // If user already has transactions, no need to re-seed
    const countTx = db.prepare(`SELECT COUNT(*) as count FROM transactions WHERE user_id = ?;`).get(userId) as { count: number };
    if (countTx && countTx.count > 0) {
      return userId;
    }
  }

  seedUserData(db, userId);
  return userId;
}

export function seedUserData(db: DatabaseSync, userId: number) {
  // Default categories
  const expenseCategories = [
    { name: 'Food', desc: 'Dining, groceries, snacks & food delivery' },
    { name: 'Transportation', desc: 'Fuel, cab, metro, bus & train fares' },
    { name: 'Education', desc: 'Books, courses, college fees & supplies' },
    { name: 'Shopping', desc: 'Clothing, gadgets & personal items' },
    { name: 'Entertainment', desc: 'Movies, streaming, outings & games' },
    { name: 'Healthcare', desc: 'Medicines, consultations & checkups' },
    { name: 'Bills', desc: 'Electricity, mobile recharge, internet & water' },
    { name: 'Travel', desc: 'Vacations, hotels & holiday bookings' },
    { name: 'Rent', desc: 'House rent & room accommodation' },
    { name: 'Other', desc: 'Miscellaneous daily expenses' }
  ];

  const incomeCategories = [
    { name: 'Salary', desc: 'Monthly professional salary' },
    { name: 'Scholarship', desc: 'Academic scholarship grants' },
    { name: 'Freelance', desc: 'Client gigs, web projects & consulting' },
    { name: 'Business', desc: 'Side ventures & commerce profits' },
    { name: 'Gift', desc: 'Family gifts & rewards' },
    { name: 'Other', desc: 'Other miscellaneous income' }
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (user_id, name, category_type, description)
    VALUES (?, ?, ?, ?);
  `);

  for (const cat of expenseCategories) {
    insertCategory.run(userId, cat.name, 'Expense', cat.desc);
  }
  for (const cat of incomeCategories) {
    insertCategory.run(userId, cat.name, 'Income', cat.desc);
  }

  // Fetch category IDs
  const getCatId = db.prepare(`SELECT id, name FROM categories WHERE user_id = ?;`);
  const catRows = getCatId.all(userId) as Array<{ id: number; name: string }>;
  const catMap = new Map<string, number>();
  catRows.forEach(r => catMap.set(r.name, r.id));

  // Current date helpers
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const nextMonth = new Date(year, now.getMonth() + 1, 0);
  const monthEnd = `${year}-${month}-${String(nextMonth.getDate()).padStart(2, '0')}`;

  // Insert overall Monthly Budget & Category Budgets
  const insertBudget = db.prepare(`
    INSERT INTO budgets (user_id, category_id, amount, start_date, end_date)
    VALUES (?, ?, ?, ?, ?);
  `);

  // Overall monthly budget of ₹20,000 as in prompt spec
  insertBudget.run(userId, null, 20000, monthStart, monthEnd);

  // Category level budget for Food: ₹5,000 (spent ₹4,500 => 90% threshold for smart alert)
  const foodId = catMap.get('Food');
  if (foodId) {
    insertBudget.run(userId, foodId, 5000, monthStart, monthEnd);
  }
  // Category level budget for Shopping: ₹4,000
  const shoppingId = catMap.get('Shopping');
  if (shoppingId) {
    insertBudget.run(userId, shoppingId, 4000, monthStart, monthEnd);
  }
  // Category level budget for Transportation: ₹2,500
  const transportId = catMap.get('Transportation');
  if (transportId) {
    insertBudget.run(userId, transportId, 2500, monthStart, monthEnd);
  }

  // Realistic Transactions matching section 29 & section 12/13
  const insertTx = db.prepare(`
    INSERT INTO transactions (user_id, transaction_type, amount, category_id, description, payment_method, transaction_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `);

  const d = (day: number) => {
    const dStr = String(Math.min(day, nextMonth.getDate())).padStart(2, '0');
    return `${year}-${month}-${dStr}`;
  };

  // Incomes (Total: ₹38,000)
  const salaryId = catMap.get('Salary');
  if (salaryId) {
    insertTx.run(userId, 'Income', 30000, salaryId, 'Monthly Internship Stipend / Salary', 'Bank Transfer', d(1), 'Credited to HDFC account');
  }
  const scholarshipId = catMap.get('Scholarship');
  if (scholarshipId) {
    insertTx.run(userId, 'Income', 5000, scholarshipId, 'Merit Scholarship Award', 'Bank Transfer', d(5), 'Semester academic scholarship');
  }
  const freelanceId = catMap.get('Freelance');
  if (freelanceId) {
    insertTx.run(userId, 'Income', 3000, freelanceId, 'Frontend Web Development Gig', 'UPI', d(10), 'React landing page delivery');
  }

  // Expenses (Total: ₹14,500)
  // Food: ₹3,500 + ₹1,000 = ₹4,500 (Triggers 90% budget alert on ₹5,000 food budget!)
  if (foodId) {
    insertTx.run(userId, 'Expense', 3500, foodId, 'Monthly Mess & Cafe Expenses', 'UPI', d(2), 'Campus canteen & grocery snacks');
    insertTx.run(userId, 'Expense', 1000, foodId, 'Weekend Team Dinner', 'Debit Card', d(12), 'Dinner at Biryani Palace');
  }
  // Transportation: ₹2,000
  if (transportId) {
    insertTx.run(userId, 'Expense', 2000, transportId, 'Monthly Metro Card Recharge', 'UPI', d(3), 'Daily college commute card');
  }
  // Education: ₹2,500
  const eduId = catMap.get('Education');
  if (eduId) {
    insertTx.run(userId, 'Expense', 2500, eduId, 'Algorithm Textbooks & Lab Kit', 'Credit Card', d(6), 'Semester 6 textbooks');
  }
  // Shopping: ₹3,000
  if (shoppingId) {
    insertTx.run(userId, 'Expense', 3000, shoppingId, 'New Wireless Earbuds', 'Credit Card', d(8), 'Purchased during festive sale');
  }
  // Entertainment: ₹1,500
  const entId = catMap.get('Entertainment');
  if (entId) {
    insertTx.run(userId, 'Expense', 1500, entId, 'Movie & OTT Subscriptions', 'UPI', d(9), 'IMAX tickets and Netflix');
  }
  // Bills: ₹2,000
  const billsId = catMap.get('Bills');
  if (billsId) {
    insertTx.run(userId, 'Expense', 2000, billsId, 'High Speed Fiber WiFi Bill', 'UPI', d(4), 'Monthly broadband bill');
  }
}

export function resetUserDemoData(db: DatabaseSync, userId: number) {
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM transactions WHERE user_id = ?;').run(userId);
    db.prepare('DELETE FROM budgets WHERE user_id = ?;').run(userId);
    db.prepare('DELETE FROM categories WHERE user_id = ?;').run(userId);
    seedUserData(db, userId);
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
