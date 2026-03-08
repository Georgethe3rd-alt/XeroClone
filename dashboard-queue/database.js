// SQLite database for agent activity logging and task management
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dashboard.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    task_description TEXT,
    model_used TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'working')),
    tokens_used INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    source TEXT DEFAULT 'telegram',
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Work' CHECK (category IN ('Work', 'Marketing', 'Development', 'Personal')),
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Urgent', 'Normal', 'Someday')),
    due_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    track_status TEXT DEFAULT 'On Track' CHECK (track_status IN ('On Track', 'At Risk', 'Off Track')),
    assigned_agent TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    session_key TEXT,
    status TEXT DEFAULT 'active',
    message_count INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT (datetime('now')),
    last_active DATETIME DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_logs_agent ON agent_logs(agent_name);
  CREATE INDEX IF NOT EXISTS idx_logs_created ON agent_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_agent ON agent_sessions(agent_name);
`);

// Prepared statements for performance
const stmts = {
  // Agent logs
  insertLog: db.prepare(`
    INSERT INTO agent_logs (agent_name, task_description, model_used, status, tokens_used, duration_ms, source)
    VALUES (@agent_name, @task_description, @model_used, @status, @tokens_used, @duration_ms, @source)
  `),
  
  getRecentLogs: db.prepare(`
    SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?
  `),

  getLogsByAgent: db.prepare(`
    SELECT * FROM agent_logs WHERE agent_name = ? ORDER BY created_at DESC LIMIT ?
  `),

  getAgentStats: db.prepare(`
    SELECT 
      agent_name,
      COUNT(*) as total_tasks,
      SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as tasks_today,
      SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as tasks_week,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      MAX(created_at) as last_active,
      MAX(model_used) as last_model
    FROM agent_logs
    GROUP BY agent_name
  `),

  getLastTaskByAgent: db.prepare(`
    SELECT task_description, model_used, created_at, status
    FROM agent_logs WHERE agent_name = ?
    ORDER BY created_at DESC LIMIT 1
  `),

  getDashboardStats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM agent_logs WHERE date(created_at) = date('now')) as tasks_today,
      (SELECT COUNT(*) FROM agent_logs WHERE created_at >= datetime('now', '-7 days')) as tasks_week,
      (SELECT COUNT(*) FROM agent_logs) as tasks_total,
      (SELECT ROUND(100.0 * SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) FROM agent_logs) as success_rate,
      (SELECT agent_name FROM agent_logs GROUP BY agent_name ORDER BY COUNT(*) DESC LIMIT 1) as most_active_agent
  `),

  // Todos
  insertTodo: db.prepare(`
    INSERT INTO todos (title, category, priority, due_date, status, track_status, assigned_agent)
    VALUES (@title, @category, @priority, @due_date, @status, @track_status, @assigned_agent)
  `),

  getAllTodos: db.prepare(`SELECT * FROM todos ORDER BY created_at DESC`),

  updateTodoStatus: db.prepare(`
    UPDATE todos SET status = ?, updated_at = datetime('now') WHERE id = ?
  `),

  updateTodo: db.prepare(`
    UPDATE todos SET title=@title, category=@category, priority=@priority, 
    due_date=@due_date, track_status=@track_status, assigned_agent=@assigned_agent,
    updated_at=datetime('now') WHERE id=@id
  `),

  deleteTodo: db.prepare(`DELETE FROM todos WHERE id = ?`),
};

module.exports = { db, stmts, DB_PATH };
