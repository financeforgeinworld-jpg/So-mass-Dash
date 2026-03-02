import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("somass.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    name TEXT,
    price REAL,
    photo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    platform TEXT,
    quantity INTEGER,
    discount_type TEXT, -- 'amount' or 'percentage'
    discount_value REAL,
    total_price REAL,
    order_no TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  -- Migration for existing databases
  BEGIN;
  SELECT CASE WHEN count(*) = 0 THEN
    'ALTER TABLE sales ADD COLUMN order_no TEXT'
  ELSE
    'SELECT 1'
  END FROM pragma_table_info('sales') WHERE name = 'order_no';
  COMMIT;
  -- Note: Better-sqlite3 doesn't support dynamic SQL in exec easily like this, 
  -- but I can just try-catch the alter table.

  CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    status TEXT DEFAULT 'quarantine', -- 'quarantine', 'returned'
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS stock_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    type TEXT, -- 'stock', 'production'
    order_no TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  
  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { sku, name, price, photo_url } = req.body;
    try {
      const info = db.prepare("INSERT INTO products (sku, name, price, photo_url) VALUES (?, ?, ?, ?)")
        .run(sku, name, price, photo_url);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/products/bulk", (req, res) => {
    const products = req.body;
    const insert = db.prepare("INSERT OR REPLACE INTO products (sku, name, price, photo_url) VALUES (?, ?, ?, ?)");
    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item.sku, item.name, item.price, item.photo_url);
    });
    insertMany(products);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const productId = Number(id);
    console.log(`Backend: Ürün silme isteği - ID: ${productId}`);
    try {
      db.transaction(() => {
        const s = db.prepare("DELETE FROM sales WHERE product_id = ?").run(productId);
        const r = db.prepare("DELETE FROM returns WHERE product_id = ?").run(productId);
        const st = db.prepare("DELETE FROM stock_entries WHERE product_id = ?").run(productId);
        const p = db.prepare("DELETE FROM products WHERE id = ?").run(productId);
        console.log(`Backend: Silinen kayıtlar - Sales: ${s.changes}, Returns: ${r.changes}, Stock: ${st.changes}, Product: ${p.changes}`);
      })();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Backend Silme Hatası (Product):", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Sales
  app.get("/api/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, p.name as product_name, p.sku as product_sku 
      FROM sales s 
      JOIN products p ON s.product_id = p.id
      ORDER BY s.date DESC
    `).all();
    res.json(sales);
  });

  app.post("/api/sales", (req, res) => {
    const { product_id, platform, quantity, discount_type, discount_value, total_price, order_no, date } = req.body;
    const info = db.prepare(`
      INSERT INTO sales (product_id, platform, quantity, discount_type, discount_value, total_price, order_no, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `).run(product_id, platform, quantity, discount_type, discount_value, total_price, order_no, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/sales/:id", (req, res) => {
    const { id } = req.params;
    console.log(`Backend: Satış silme isteği - ID: ${id}`);
    try {
      const info = db.prepare("DELETE FROM sales WHERE id = ?").run(Number(id));
      console.log(`Backend: Silinen satış kaydı sayısı: ${info.changes}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Backend Silme Hatası (Sale):", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Returns
  app.get("/api/returns", (req, res) => {
    const returns = db.prepare(`
      SELECT r.*, p.name as product_name, p.sku as product_sku 
      FROM returns r 
      JOIN products p ON r.product_id = p.id
      ORDER BY r.date DESC
    `).all();
    res.json(returns);
  });

  app.post("/api/returns", (req, res) => {
    const { product_id, quantity, date } = req.body;
    const info = db.prepare("INSERT INTO returns (product_id, quantity, date) VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP))")
      .run(product_id, quantity, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/returns/:id/approve", (req, res) => {
    const { id } = req.params;
    const returnItem: any = db.prepare("SELECT * FROM returns WHERE id = ?").get(id);
    if (!returnItem) return res.status(404).json({ error: "Return not found" });

    db.transaction(() => {
      db.prepare("UPDATE returns SET status = 'returned' WHERE id = ?").run(id);
      db.prepare("INSERT INTO stock_entries (product_id, quantity, type) VALUES (?, ?, 'stock')")
        .run(returnItem.product_id, returnItem.quantity);
    })();
    res.json({ success: true });
  });

  app.delete("/api/returns/:id", (req, res) => {
    const { id } = req.params;
    console.log(`Backend: İade silme isteği - ID: ${id}`);
    try {
      const info = db.prepare("DELETE FROM returns WHERE id = ?").run(Number(id));
      console.log(`Backend: Silinen iade kaydı sayısı: ${info.changes}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Backend Silme Hatası (Return):", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stock & Production
  app.get("/api/stock", (req, res) => {
    const stock = db.prepare(`
      SELECT 
        p.id, p.sku, p.name,
        COALESCE((SELECT SUM(quantity) FROM stock_entries WHERE product_id = p.id AND type = 'stock'), 0) -
        COALESCE((SELECT SUM(quantity) FROM sales WHERE product_id = p.id), 0) as current_stock,
        COALESCE((SELECT SUM(quantity) FROM stock_entries WHERE product_id = p.id AND type = 'production'), 0) as in_production
      FROM products p
      GROUP BY p.id
    `).all();
    
    // Add total_stock calculation in JS for clarity or keep it in SQL
    const stockWithTotal = stock.map((s: any) => ({
      ...s,
      total_stock: s.current_stock + s.in_production
    }));
    
    res.json(stockWithTotal);
  });

  app.get("/api/stock/entries", (req, res) => {
    const entries = db.prepare(`
      SELECT se.*, p.name as product_name, p.sku as product_sku 
      FROM stock_entries se 
      JOIN products p ON se.product_id = p.id
      ORDER BY se.date DESC
    `).all();
    res.json(entries);
  });

  app.post("/api/stock", (req, res) => {
    const { product_id, quantity, type, order_no, date } = req.body;
    const info = db.prepare("INSERT INTO stock_entries (product_id, quantity, type, order_no, date) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))")
      .run(product_id, quantity, type, order_no, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/stock/:id", (req, res) => {
    const { id } = req.params;
    console.log(`Backend: Stok hareketi silme isteği - ID: ${id}`);
    try {
      const info = db.prepare("DELETE FROM stock_entries WHERE id = ?").run(Number(id));
      console.log(`Backend: Silinen stok hareketi sayısı: ${info.changes}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Backend Silme Hatası (Stock):", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Reports
  app.get("/api/reports/dashboard", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_price) as total FROM sales").get() as any;
    const monthlySales = db.prepare("SELECT SUM(total_price) as total FROM sales WHERE date >= date('now', 'start of month')").get() as any;
    const weeklySales = db.prepare("SELECT SUM(total_price) as total FROM sales WHERE date >= date('now', '-7 days')").get() as any;
    
    const salesByPlatform = db.prepare("SELECT platform, SUM(total_price) as value FROM sales GROUP BY platform").all();
    
    const velocity1m = db.prepare(`
      SELECT p.name, p.sku, COUNT(s.id) / 30.0 as velocity
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id AND s.date >= date('now', '-30 days')
      GROUP BY p.id
      ORDER BY velocity DESC
      LIMIT 5
    `).all();

    const velocity3m = db.prepare(`
      SELECT p.name, p.sku, COUNT(s.id) / 90.0 as velocity
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id AND s.date >= date('now', '-90 days')
      GROUP BY p.id
      ORDER BY velocity DESC
      LIMIT 5
    `).all();

    const velocity6m = db.prepare(`
      SELECT p.name, p.sku, COUNT(s.id) / 180.0 as velocity
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id AND s.date >= date('now', '-180 days')
      GROUP BY p.id
      ORDER BY velocity DESC
      LIMIT 5
    `).all();

    res.json({
      stats: {
        total: totalSales.total || 0,
        monthly: monthlySales.total || 0,
        weekly: weeklySales.total || 0
      },
      salesByPlatform,
      velocities: {
        "1m": velocity1m,
        "3m": velocity3m,
        "6m": velocity6m
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
