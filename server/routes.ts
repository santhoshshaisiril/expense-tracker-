import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, resetUserDemoData, seedDemoData } from './db.js';
import { authenticateToken, AuthenticatedRequest, generateToken } from './auth.js';

const router = Router();
const db = getDb();

// Seed initial demo data
seedDemoData(db);

/* ==========================================================================
   1. AUTHENTICATION REST APIS
   ========================================================================== */

// POST /api/auth/register/
router.post('/auth/register/', (req, res) => {
  const { full_name, email, password, confirm_password, username } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Full name, email, and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters long.' });
  }

  if (confirm_password && password !== confirm_password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Passwords do not match.' });
  }

  const sanitizedUsername = (username || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  try {
    const checkEmail = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?;').get(email, sanitizedUsername);
    if (checkEmail) {
      return res.status(409).json({ error: 'Conflict', message: 'A user with this email or username already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES (?, ?, ?, ?);
    `);
    const result = stmt.run(sanitizedUsername, email, passwordHash, full_name.trim());
    const newUserId = Number(result.lastInsertRowid);

    // Seed default categories for the new user
    const defaultExpenseCategories = [
      'Food', 'Transportation', 'Education', 'Shopping', 'Entertainment',
      'Healthcare', 'Bills', 'Travel', 'Rent', 'Other'
    ];
    const defaultIncomeCategories = [
      'Salary', 'Scholarship', 'Freelance', 'Business', 'Gift', 'Other'
    ];

    const insertCat = db.prepare('INSERT INTO categories (user_id, name, category_type, description) VALUES (?, ?, ?, ?);');
    for (const name of defaultExpenseCategories) {
      insertCat.run(newUserId, name, 'Expense', `${name} expenses`);
    }
    for (const name of defaultIncomeCategories) {
      insertCat.run(newUserId, name, 'Income', `${name} earnings`);
    }

    const user = {
      id: newUserId,
      username: sanitizedUsername,
      email,
      full_name: full_name.trim()
    };

    const token = generateToken(user);
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Could not register user. Please try again.' });
  }
});

// POST /api/auth/login/
router.post('/auth/login/', (req, res) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email/Username and password are required.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?;');
    const user = stmt.get(identifier, identifier) as any;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email/username or password.' });
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email/username or password.' });
    }

    const authUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name
    };

    const token = generateToken(authUser);
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: authUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout/
router.post('/auth/logout/', (req, res) => {
  return res.status(200).json({ message: 'Successfully logged out' });
});

// GET /api/auth/me/
router.get('/auth/me/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ user: req.user });
});

/* ==========================================================================
   2. CATEGORIES REST APIS
   ========================================================================== */

// GET /api/categories/
router.get('/categories/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const type = req.query.type as string | undefined;

  try {
    let query = 'SELECT * FROM categories WHERE user_id = ?';
    const params: any[] = [userId];

    if (type && ['Income', 'Expense'].includes(type)) {
      query += ' AND category_type = ?';
      params.push(type);
    }
    query += ' ORDER BY name ASC;';

    const categories = db.prepare(query).all(...params);
    return res.status(200).json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve categories.' });
  }
});

// POST /api/categories/
router.post('/categories/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, category_type, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Category name is required.' });
  }
  if (!category_type || !['Income', 'Expense'].includes(category_type)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Category type must be Income or Expense.' });
  }

  try {
    // Check duplicate
    const existing = db.prepare('SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?) AND category_type = ?;')
      .get(userId, name.trim(), category_type);

    if (existing) {
      return res.status(400).json({ error: 'Validation Error', message: `Category "${name.trim()}" already exists for ${category_type}.` });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (user_id, name, category_type, description)
      VALUES (?, ?, ?, ?);
    `);
    const result = stmt.run(userId, name.trim(), category_type, description ? description.trim() : '');
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?;').get(Number(result.lastInsertRowid));

    return res.status(201).json(newCategory);
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to create category.' });
  }
});

// PUT / PATCH /api/categories/:id/
router.all(['/categories/:id/', '/categories/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response, next) => {
  if (!['PUT', 'PATCH'].includes(req.method)) return next();

  const userId = req.user!.id;
  const catId = Number(req.params.id);
  const { name, category_type, description } = req.body;

  if (isNaN(catId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid category ID.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?;').get(catId, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Category not found.' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedType = category_type !== undefined ? category_type : existing.category_type;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;

    if (!updatedName) {
      return res.status(400).json({ error: 'Validation Error', message: 'Category name cannot be empty.' });
    }

    // Check duplicate for different category
    const duplicate = db.prepare('SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?) AND category_type = ? AND id != ?;')
      .get(userId, updatedName, updatedType, catId);
    if (duplicate) {
      return res.status(400).json({ error: 'Validation Error', message: `Category "${updatedName}" already exists.` });
    }

    db.prepare(`
      UPDATE categories
      SET name = ?, category_type = ?, description = ?
      WHERE id = ? AND user_id = ?;
    `).run(updatedName, updatedType, updatedDesc, catId, userId);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?;').get(catId);
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id/
router.delete(['/categories/:id/', '/categories/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const catId = Number(req.params.id);

  if (isNaN(catId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid category ID.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?;').get(catId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Category not found.' });
    }

    // Check if category is used in transactions
    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?;').get(catId) as { count: number };
    if (txCount && txCount.count > 0) {
      return res.status(400).json({
        error: 'Conflict',
        message: `Cannot delete category because it is associated with ${txCount.count} existing transaction(s). Please reassign or delete those transactions first.`
      });
    }

    db.prepare('DELETE FROM budgets WHERE category_id = ?;').run(catId);
    db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?;').run(catId, userId);

    return res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to delete category.' });
  }
});

/* ==========================================================================
   3. TRANSACTIONS REST APIS
   ========================================================================== */

// GET /api/transactions/
router.get('/transactions/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    search,
    type,
    category_id,
    payment_method,
    start_date,
    end_date,
    min_amount,
    max_amount,
    sort_by = 'transaction_date',
    sort_order = 'DESC',
    page = '1',
    limit = '50'
  } = req.query as Record<string, string>;

  try {
    let whereClauses = ['t.user_id = ?'];
    let params: any[] = [userId];

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereClauses.push('(t.description LIKE ? OR t.notes LIKE ? OR c.name LIKE ? OR t.payment_method LIKE ? OR CAST(t.id AS TEXT) LIKE ? OR CAST(t.amount AS TEXT) LIKE ?)');
      params.push(s, s, s, s, s, s);
    }

    if (type && ['Income', 'Expense'].includes(type)) {
      whereClauses.push('t.transaction_type = ?');
      params.push(type);
    }

    if (category_id && !isNaN(Number(category_id))) {
      whereClauses.push('t.category_id = ?');
      params.push(Number(category_id));
    }

    if (payment_method && payment_method.trim() && payment_method !== 'All') {
      whereClauses.push('t.payment_method = ?');
      params.push(payment_method.trim());
    }

    if (start_date) {
      whereClauses.push('t.transaction_date >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereClauses.push('t.transaction_date <= ?');
      params.push(end_date);
    }

    if (min_amount && !isNaN(Number(min_amount))) {
      whereClauses.push('t.amount >= ?');
      params.push(Number(min_amount));
    }

    if (max_amount && !isNaN(Number(max_amount))) {
      whereClauses.push('t.amount <= ?');
      params.push(Number(max_amount));
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE ${whereSql};
    `;
    const totalRow = db.prepare(countSql).get(...params) as { total: number };
    const totalCount = totalRow ? totalRow.total : 0;

    // Sorting safe fields
    const validSortFields: Record<string, string> = {
      transaction_date: 't.transaction_date',
      amount: 't.amount',
      description: 't.description',
      created_at: 't.created_at',
      category: 'c.name'
    };
    const sortField = validSortFields[sort_by] || 't.transaction_date';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT
        t.id,
        t.user_id,
        t.transaction_type,
        t.amount,
        t.category_id,
        c.name AS category_name,
        t.description,
        t.payment_method,
        t.transaction_date,
        t.notes,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE ${whereSql}
      ORDER BY ${sortField} ${sortDirection}, t.id DESC
      LIMIT ? OFFSET ?;
    `;
    const rows = db.prepare(dataSql).all(...params, limitNum, offset);

    return res.status(200).json({
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalCount / limitNum),
      results: rows
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve transactions.' });
  }
});

// POST /api/transactions/
router.post('/transactions/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    transaction_type,
    amount,
    category_id,
    description,
    payment_method,
    transaction_date,
    notes
  } = req.body;

  // Validation
  if (!transaction_type || !['Income', 'Expense'].includes(transaction_type)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Transaction type is required and must be Income or Expense.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'Amount is required and must be greater than zero.' });
  }

  if (!category_id) {
    return res.status(400).json({ error: 'Validation Error', message: 'Please select a category.' });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Description is required.' });
  }

  if (!payment_method || !payment_method.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Payment method is required.' });
  }

  if (!transaction_date || isNaN(Date.parse(transaction_date))) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid transaction date.' });
  }

  try {
    // Verify category belongs to user
    const cat = db.prepare('SELECT id, name, category_type FROM categories WHERE id = ? AND user_id = ?;')
      .get(category_id, userId) as any;
    if (!cat) {
      return res.status(400).json({ error: 'Validation Error', message: 'Selected category does not exist.' });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (
        user_id, transaction_type, amount, category_id,
        description, payment_method, transaction_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      userId,
      transaction_type,
      parsedAmount,
      cat.id,
      description.trim(),
      payment_method.trim(),
      transaction_date,
      notes ? notes.trim() : ''
    );

    const newTxId = Number(result.lastInsertRowid);
    const createdTx = db.prepare(`
      SELECT
        t.*,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?;
    `).get(newTxId);

    return res.status(201).json({
      message: `${transaction_type} of ₹${parsedAmount.toLocaleString('en-IN')} added successfully!`,
      transaction: createdTx
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to record transaction.' });
  }
});

// GET /api/transactions/:id/
router.get(['/transactions/:id/', '/transactions/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const txId = Number(req.params.id);

  if (isNaN(txId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid transaction ID.' });
  }

  try {
    const tx = db.prepare(`
      SELECT
        t.*,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.user_id = ?;
    `).get(txId, userId);

    if (!tx) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction record not found.' });
    }

    return res.status(200).json(tx);
  } catch (err) {
    console.error('Get transaction detail error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to fetch transaction details.' });
  }
});

// PUT / PATCH /api/transactions/:id/
router.all(['/transactions/:id/', '/transactions/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response, next) => {
  if (!['PUT', 'PATCH'].includes(req.method)) return next();

  const userId = req.user!.id;
  const txId = Number(req.params.id);

  if (isNaN(txId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid transaction ID.' });
  }

  const {
    transaction_type,
    amount,
    category_id,
    description,
    payment_method,
    transaction_date,
    notes
  } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?;').get(txId, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found.' });
    }

    const newType = transaction_type || existing.transaction_type;
    let newAmount = existing.amount;
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Amount must be greater than zero.' });
      }
      newAmount = parsed;
    }

    let newCategoryId = existing.category_id;
    if (category_id !== undefined) {
      const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?;').get(category_id, userId);
      if (!cat) {
        return res.status(400).json({ error: 'Validation Error', message: 'Selected category does not exist.' });
      }
      newCategoryId = category_id;
    }

    const newDesc = description !== undefined ? description.trim() : existing.description;
    const newMethod = payment_method !== undefined ? payment_method.trim() : existing.payment_method;
    const newDate = transaction_date !== undefined ? transaction_date : existing.transaction_date;
    const newNotes = notes !== undefined ? notes.trim() : existing.notes;

    db.prepare(`
      UPDATE transactions
      SET transaction_type = ?, amount = ?, category_id = ?, description = ?,
          payment_method = ?, transaction_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?;
    `).run(newType, newAmount, newCategoryId, newDesc, newMethod, newDate, newNotes, txId, userId);

    const updatedTx = db.prepare(`
      SELECT
        t.*,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?;
    `).get(txId);

    return res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTx
    });
  } catch (err) {
    console.error('Update transaction error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to update transaction.' });
  }
});

// DELETE /api/transactions/:id/
router.delete(['/transactions/:id/', '/transactions/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const txId = Number(req.params.id);

  if (isNaN(txId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid transaction ID.' });
  }

  try {
    const existing = db.prepare('SELECT id, description, amount FROM transactions WHERE id = ? AND user_id = ?;').get(txId, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Transaction not found.' });
    }

    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?;').run(txId, userId);
    return res.status(200).json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to delete transaction.' });
  }
});

/* ==========================================================================
   4. BUDGETS REST APIS
   ========================================================================== */

// GET /api/budgets/
router.get('/budgets/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const budgets = db.prepare(`
      SELECT
        b.*,
        c.name as category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.category_id IS NULL DESC, b.created_at DESC;
    `).all(userId) as any[];

    // Calculate actual spending for each budget in its active date range
    const budgetsWithSpent = budgets.map(b => {
      let spent = 0;
      if (b.category_id === null) {
        // Overall expense budget
        const row = db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total_spent
          FROM transactions
          WHERE user_id = ? AND transaction_type = 'Expense'
            AND transaction_date >= ? AND transaction_date <= ?;
        `).get(userId, b.start_date, b.end_date) as { total_spent: number };
        spent = row ? row.total_spent : 0;
      } else {
        // Category specific budget
        const row = db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total_spent
          FROM transactions
          WHERE user_id = ? AND category_id = ? AND transaction_type = 'Expense'
            AND transaction_date >= ? AND transaction_date <= ?;
        `).get(userId, b.category_id, b.start_date, b.end_date) as { total_spent: number };
        spent = row ? row.total_spent : 0;
      }

      const remaining = Math.max(0, b.amount - spent);
      const usagePercent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      let status: 'Safe' | 'Warning' | 'Exceeded' = 'Safe';
      if (usagePercent >= 100) {
        status = 'Exceeded';
      } else if (usagePercent >= 80) {
        status = 'Warning';
      }

      return {
        ...b,
        spent,
        remaining,
        usage_percent: Math.round(usagePercent * 10) / 10,
        status
      };
    });

    return res.status(200).json(budgetsWithSpent);
  } catch (err) {
    console.error('Get budgets error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve budgets.' });
  }
});

// POST /api/budgets/
router.post('/budgets/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { category_id, amount, start_date, end_date } = req.body;

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'Budget amount must be greater than zero.' });
  }

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Validation Error', message: 'Start date and end date are required.' });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Start date cannot be after end date.' });
  }

  try {
    let catIdToUse: number | null = null;
    if (category_id && category_id !== 'overall') {
      const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?;').get(Number(category_id), userId);
      if (!cat) {
        return res.status(400).json({ error: 'Validation Error', message: 'Selected category does not exist.' });
      }
      catIdToUse = Number(category_id);
    }

    const stmt = db.prepare(`
      INSERT INTO budgets (user_id, category_id, amount, start_date, end_date)
      VALUES (?, ?, ?, ?, ?);
    `);
    const result = stmt.run(userId, catIdToUse, parsedAmount, start_date, end_date);
    const newBudgetId = Number(result.lastInsertRowid);

    const created = db.prepare(`
      SELECT b.*, c.name as category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?;
    `).get(newBudgetId);

    return res.status(201).json(created);
  } catch (err) {
    console.error('Create budget error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to create budget.' });
  }
});

// PUT / PATCH /api/budgets/:id/
router.all(['/budgets/:id/', '/budgets/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response, next) => {
  if (!['PUT', 'PATCH'].includes(req.method)) return next();

  const userId = req.user!.id;
  const budgetId = Number(req.params.id);

  if (isNaN(budgetId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid budget ID.' });
  }

  const { category_id, amount, start_date, end_date } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?;').get(budgetId, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found.' });
    }

    let updatedAmount = existing.amount;
    if (amount !== undefined) {
      const p = parseFloat(amount);
      if (isNaN(p) || p <= 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Budget amount must be positive.' });
      }
      updatedAmount = p;
    }

    let updatedCatId = existing.category_id;
    if (category_id !== undefined) {
      if (category_id === 'overall' || category_id === null) {
        updatedCatId = null;
      } else {
        const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?;').get(Number(category_id), userId);
        if (!cat) {
          return res.status(400).json({ error: 'Validation Error', message: 'Selected category does not exist.' });
        }
        updatedCatId = Number(category_id);
      }
    }

    const updatedStart = start_date || existing.start_date;
    const updatedEnd = end_date || existing.end_date;

    db.prepare(`
      UPDATE budgets
      SET category_id = ?, amount = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?;
    `).run(updatedCatId, updatedAmount, updatedStart, updatedEnd, budgetId, userId);

    const updated = db.prepare(`
      SELECT b.*, c.name as category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?;
    `).get(budgetId);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Update budget error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to update budget.' });
  }
});

// DELETE /api/budgets/:id/
router.delete(['/budgets/:id/', '/budgets/:id'], authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const budgetId = Number(req.params.id);

  if (isNaN(budgetId)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid budget ID.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?;').get(budgetId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Budget not found.' });
    }

    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?;').run(budgetId, userId);
    return res.status(200).json({ message: 'Budget deleted successfully.' });
  } catch (err) {
    console.error('Delete budget error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to delete budget.' });
  }
});

/* ==========================================================================
   5. DASHBOARD SUMMARY & ANALYTICS REST API
   ========================================================================== */

// GET /api/dashboard/
router.get('/dashboard/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    // Current month bounds
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;
    const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const monthEnd = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;

    // 1. Overall Totals
    const totalIncomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_type = 'Income';
    `).get(userId) as { total: number };
    const totalIncome = totalIncomeRow ? totalIncomeRow.total : 0;

    const totalExpenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_type = 'Expense';
    `).get(userId) as { total: number };
    const totalExpenses = totalExpenseRow ? totalExpenseRow.total : 0;

    const currentBalance = totalIncome - totalExpenses;
    const savings = Math.max(0, currentBalance);

    // Current Month Totals
    const monthIncomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_type = 'Income'
        AND transaction_date >= ? AND transaction_date <= ?;
    `).get(userId, monthStart, monthEnd) as { total: number };
    const monthlyIncome = monthIncomeRow ? monthIncomeRow.total : 0;

    const monthExpenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_type = 'Expense'
        AND transaction_date >= ? AND transaction_date <= ?;
    `).get(userId, monthStart, monthEnd) as { total: number };
    const monthlyExpense = monthExpenseRow ? monthExpenseRow.total : 0;

    // Monthly Budget & Remaining
    const monthlyBudgetRow = db.prepare(`
      SELECT amount
      FROM budgets
      WHERE user_id = ? AND category_id IS NULL
        AND start_date <= ? AND end_date >= ?
      ORDER BY id DESC LIMIT 1;
    `).get(userId, monthEnd, monthStart) as { amount: number } | undefined;

    const monthlyBudget = monthlyBudgetRow ? monthlyBudgetRow.amount : 20000;
    const remainingBudget = Math.max(0, monthlyBudget - monthlyExpense);
    const budgetUsedPercent = monthlyBudget > 0 ? (monthlyExpense / monthlyBudget) * 100 : 0;

    // 2. Chart 1: Expense by Category
    const categoryExpenses = db.prepare(`
      SELECT
        c.name as category,
        COALESCE(SUM(t.amount), 0) as amount
      FROM categories c
      JOIN transactions t ON c.id = t.category_id
      WHERE t.user_id = ? AND t.transaction_type = 'Expense'
      GROUP BY c.id, c.name
      ORDER BY amount DESC;
    `).all(userId) as Array<{ category: string; amount: number }>;

    // 3. Chart 2: Monthly Income vs Expense (last 6 months)
    const monthlyTrend: Array<{ month: string; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(year, now.getMonth() - i, 1);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const start = `${y}-${m}-01`;
      const endDay = new Date(y, targetDate.getMonth() + 1, 0).getDate();
      const end = `${y}-${m}-${String(endDay).padStart(2, '0')}`;
      const monthLabel = targetDate.toLocaleString('default', { month: 'short', year: '2-digit' });

      const inc = (db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE user_id = ? AND transaction_type = 'Income' AND transaction_date >= ? AND transaction_date <= ?;
      `).get(userId, start, end) as any).total;

      const exp = (db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE user_id = ? AND transaction_type = 'Expense' AND transaction_date >= ? AND transaction_date <= ?;
      `).get(userId, start, end) as any).total;

      monthlyTrend.push({
        month: monthLabel,
        income: inc,
        expense: exp
      });
    }

    // 4. Chart 3: Weekly Spending (current week Mon-Sun)
    const curr = new Date();
    const firstDay = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); // Monday
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklySpending: Array<{ day: string; date: string; amount: number }> = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(curr.setDate(firstDay + i));
      const dayStr = dayDate.toISOString().split('T')[0];
      const dayExp = (db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE user_id = ? AND transaction_type = 'Expense' AND transaction_date = ?;
      `).get(userId, dayStr) as any).total;

      weeklySpending.push({
        day: weekDays[i],
        date: dayStr,
        amount: dayExp
      });
    }

    // 5. Chart 4: Budget Usage Breakdown
    const budgetUsage = {
      budget: monthlyBudget,
      used: monthlyExpense,
      remaining: remainingBudget,
      percent: Math.round(budgetUsedPercent * 10) / 10
    };

    // 6. Chart 5: Top Spending Categories (top 5)
    const topCategories = categoryExpenses.slice(0, 5);

    // 7. Recent Transactions (last 6)
    const recentTransactions = db.prepare(`
      SELECT
        t.*,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT 6;
    `).all(userId);

    // 8. Smart Budget Alerts
    const alerts: Array<{
      id: string;
      level: 'warning' | 'danger' | 'info';
      title: string;
      message: string;
      category?: string;
      percent: number;
    }> = [];

    // Monthly alert
    if (budgetUsedPercent >= 100) {
      alerts.push({
        id: 'monthly-exceeded',
        level: 'danger',
        title: 'Budget Exceeded',
        message: `Your monthly spending of ₹${monthlyExpense.toLocaleString('en-IN')} has crossed your ₹${monthlyBudget.toLocaleString('en-IN')} budget.`,
        percent: Math.round(budgetUsedPercent)
      });
    } else if (budgetUsedPercent >= 80) {
      alerts.push({
        id: 'monthly-warning',
        level: 'warning',
        title: 'Warning: 80% Budget Threshold',
        message: `You have used ${Math.round(budgetUsedPercent)}% of your monthly budget (₹${monthlyExpense.toLocaleString('en-IN')} / ₹${monthlyBudget.toLocaleString('en-IN')}).`,
        percent: Math.round(budgetUsedPercent)
      });
    }

    // Category specific budget alerts
    const categoryBudgets = db.prepare(`
      SELECT b.*, c.name as category_name
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.category_id IS NOT NULL
        AND b.start_date <= ? AND b.end_date >= ?;
    `).all(userId, monthEnd, monthStart) as any[];

    for (const cb of categoryBudgets) {
      const spentRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND transaction_type = 'Expense'
          AND transaction_date >= ? AND transaction_date <= ?;
      `).get(userId, cb.category_id, cb.start_date, cb.end_date) as { spent: number };
      const catSpent = spentRow ? spentRow.spent : 0;
      const catPercent = cb.amount > 0 ? (catSpent / cb.amount) * 100 : 0;

      if (catPercent >= 100) {
        alerts.push({
          id: `cat-${cb.id}-exceeded`,
          level: 'danger',
          title: `${cb.category_name} Budget Exceeded`,
          message: `${cb.category_name} spending (₹${catSpent.toLocaleString('en-IN')}) has exceeded its ₹${cb.amount.toLocaleString('en-IN')} limit!`,
          category: cb.category_name,
          percent: Math.round(catPercent)
        });
      } else if (catPercent >= 80) {
        alerts.push({
          id: `cat-${cb.id}-warning`,
          level: 'warning',
          title: `${cb.category_name} Budget Limit Alert`,
          message: `${cb.category_name} category is close to its limit: ${Math.round(catPercent)}% used (₹${catSpent.toLocaleString('en-IN')} / ₹${cb.amount.toLocaleString('en-IN')}).`,
          category: cb.category_name,
          percent: Math.round(catPercent)
        });
      }
    }

    return res.status(200).json({
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        current_balance: currentBalance,
        monthly_income: monthlyIncome,
        monthly_expense: monthlyExpense,
        monthly_budget: monthlyBudget,
        remaining_budget: remainingBudget,
        savings: savings,
        savings_percentage: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0
      },
      charts: {
        expense_by_category: categoryExpenses,
        monthly_trend: monthlyTrend,
        weekly_spending: weeklySpending,
        budget_usage: budgetUsage,
        top_categories: topCategories
      },
      recent_transactions: recentTransactions,
      alerts
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to generate dashboard statistics.' });
  }
});

/* ==========================================================================
   6. REPORTS REST APIS
   ========================================================================== */

// GET /api/reports/monthly/
router.get('/reports/monthly/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const now = new Date();
  const year = parseInt(req.query.year as string, 10) || now.getFullYear();
  const month = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);

  const monthPadded = String(month).padStart(2, '0');
  const startDate = `${year}-${monthPadded}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${monthPadded}-${String(lastDay).padStart(2, '0')}`;

  try {
    const incRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_type = 'Income'
        AND transaction_date >= ? AND transaction_date <= ?;
    `).get(userId, startDate, endDate) as { total: number };
    const totalIncome = incRow ? incRow.total : 0;

    const expRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND transaction_type = 'Expense'
        AND transaction_date >= ? AND transaction_date <= ?;
    `).get(userId, startDate, endDate) as { total: number; count: number };
    const totalExpenses = expRow ? expRow.total : 0;
    const expenseCount = expRow ? expRow.count : 0;

    const totalTxCount = (db.prepare(`
      SELECT COUNT(*) as count FROM transactions
      WHERE user_id = ? AND transaction_date >= ? AND transaction_date <= ?;
    `).get(userId, startDate, endDate) as any).count;

    const savings = totalIncome - totalExpenses;
    const averageDailyExpense = lastDay > 0 ? Math.round((totalExpenses / lastDay) * 100) / 100 : 0;

    // Highest Expense in this month
    const highestExpense = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.transaction_type = 'Expense'
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      ORDER BY t.amount DESC LIMIT 1;
    `).get(userId, startDate, endDate);

    // Highest Spending Category in this month
    const highestCat = db.prepare(`
      SELECT c.name as category_name, SUM(t.amount) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.transaction_type = 'Expense'
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      GROUP BY c.id, c.name
      ORDER BY total_amount DESC LIMIT 1;
    `).get(userId, startDate, endDate);

    // Monthly Budget
    const budgetRow = db.prepare(`
      SELECT amount FROM budgets
      WHERE user_id = ? AND category_id IS NULL
        AND start_date <= ? AND end_date >= ?
      ORDER BY id DESC LIMIT 1;
    `).get(userId, endDate, startDate) as { amount: number } | undefined;
    const budget = budgetRow ? budgetRow.amount : 20000;
    const remainingBudget = Math.max(0, budget - totalExpenses);

    // All transactions in this month
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      ORDER BY t.transaction_date DESC, t.id DESC;
    `).all(userId, startDate, endDate);

    return res.status(200).json({
      period: {
        year,
        month,
        start_date: startDate,
        end_date: endDate,
        days_in_month: lastDay
      },
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        savings,
        budget,
        remaining_budget: remainingBudget,
        average_daily_expense: averageDailyExpense,
        highest_expense: highestExpense,
        highest_spending_category: highestCat,
        total_transactions: totalTxCount
      },
      transactions
    });
  } catch (err) {
    console.error('Monthly report error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to generate monthly report.' });
  }
});

// GET /api/reports/category/
router.get('/reports/category/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };

  try {
    let dateFilter = '';
    const params: any[] = [userId];

    if (start_date && end_date) {
      dateFilter = ' AND t.transaction_date >= ? AND t.transaction_date <= ?';
      params.push(start_date, end_date);
    }

    const totalExpRow = db.prepare(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      WHERE t.user_id = ? AND t.transaction_type = 'Expense' ${dateFilter};
    `).get(...params) as { total: number };
    const totalExpenses = totalExpRow ? totalExpRow.total : 0;

    const categoryBreakdown = db.prepare(`
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.description,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_spending
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.transaction_type = 'Expense' ${dateFilter.replace(/t\./g, 't.')}
      WHERE c.user_id = ? AND c.category_type = 'Expense'
      GROUP BY c.id, c.name, c.description
      HAVING total_spending > 0
      ORDER BY total_spending DESC;
    `).all(...params, userId) as any[];

    const results = categoryBreakdown.map(item => ({
      ...item,
      percentage: totalExpenses > 0 ? Math.round((item.total_spending / totalExpenses) * 1000) / 10 : 0
    }));

    return res.status(200).json({
      total_expenses: totalExpenses,
      categories: results
    });
  } catch (err) {
    console.error('Category report error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to generate category report.' });
  }
});

/* ==========================================================================
   7. DEMO UTILITIES & LIVE SCHEMA INSPECTION (FOR COLLEGE VIVA & DEMO)
   ========================================================================== */

// POST /api/demo/reset/
router.post('/demo/reset/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    resetUserDemoData(db, userId);
    return res.status(200).json({ message: 'Demo data reset successfully with fresh sample records!' });
  } catch (err) {
    console.error('Reset demo error:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to reset demo data.' });
  }
});

// GET /api/schema/inspect/
router.get('/schema/inspect/', (req, res) => {
  try {
    const tables = ['users', 'categories', 'transactions', 'budgets'];
    const inspection: Record<string, { count: number; columns: any[] }> = {};

    for (const t of tables) {
      const count = (db.prepare(`SELECT COUNT(*) as count FROM ${t};`).get() as any).count;
      const columns = db.prepare(`PRAGMA table_info(${t});`).all();
      inspection[t] = { count, columns };
    }

    return res.status(200).json({
      database: 'SQLite (smart_expense.db)',
      engine: 'Embedded Relational Engine (node:sqlite / SQLite 3)',
      tables: inspection
    });
  } catch (err) {
    return res.status(500).json({ error: 'Inspection Error', message: 'Failed to inspect schema.' });
  }
});

export default router;
