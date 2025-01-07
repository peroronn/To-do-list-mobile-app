import * as SQLite from 'expo-sqlite';
import { parse, format } from 'date-fns'; 
const database_name = "todoDB";
const database_version = "1.0";
const database_displayname = "ToDo Database";
const database_size = 200000;

let db = null;

export const openDatabase = async () => {
  if (!db) {
    try {
      db = SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      );
      console.log("Database opened successfully");
    } catch (error) {
      console.error("Error opening database: ", error);
    }
  }
  return db;
};

export const createTables = async () => {
  try {
    const db = await openDatabase();
    if (!db) throw new Error("Database not opened");

    await db.transaction(tx => {
    /*  tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          userid INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          displayName TEXT,
          googleId TEXT,           -- Google account ID to uniquely identify the user
          accessToken TEXT,        -- OAuth access token for API access
          refreshToken TEXT,       -- OAuth refresh token for refreshing the access token
          lastSync TIMESTAMP,      -- Timestamp of the last successful sync
          UNIQUE(googleId)         -- Ensure each Google ID is unique
        );`
      );
*/
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS task (
          taskid INTEGER PRIMARY KEY AUTOINCREMENT,
          tasktext TEXT,
          donestatus INTEGER NOT NULL DEFAULT 0,
          favorite INTEGER NOT NULL DEFAULT 0,
          alarm TEXT,
          duedate TEXT,
          repeatstatus TEXT,
          description TEXT,
          lastCompletedDate TEXT
        );`
      );
/*
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pending_sync (
          syncid INTEGER PRIMARY KEY AUTOINCREMENT,
          userid INTEGER,           -- Foreign key to link the change to a specific user
          taskid INTEGER,           -- Foreign key to link the change to a specific task
          actionType TEXT,          -- 'ADD', 'UPDATE', 'DELETE', etc.
          timestamp TIMESTAMP,      -- Time when the action was recorded
          FOREIGN KEY (userid) REFERENCES users(userid),
          FOREIGN KEY (taskid) REFERENCES task(taskid)
        );`
      );
/*
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS subtask (
          subtaskid INTEGER PRIMARY KEY AUTOINCREMENT,
          taskid INTEGER,
          subtext TEXT,
          subdonestatus INTEGER,
          FOREIGN KEY(taskid) REFERENCES task(taskid)
        );`
      );

      );
      */
    });
    console.log("Tables created successfully");
  } catch (error) {
    console.log("Error creating tables: ", error);
  }
};

export const insertTask = async (taskText, dueDate, alarm) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO task (tasktext, duedate, alarm, donestatus, favorite) VALUES (?, ?, ?, ?, ?)',
        [taskText, dueDate, alarm, 0, 0], 
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error inserting task:", error);
          reject(error);
        }
      );
    });
  });
};

export const getTasks = async () => {
  try {
    const db = await openDatabase();
    if (!db) throw new Error("Database not opened");

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM task ORDER BY taskid DESC ',
          [],
          (tx, results) => {
            const tasks = [];
            for (let i = 0; i < results.rows.length; i++) {
              tasks.push(results.rows.item(i));
            }
            resolve(tasks);
          },
          (tx, error) => {
            console.error("Error executing SQL: ", error);
            reject(error);
          }
        );
      });
    });
  } catch (error) {
    console.error("Error fetching tasks: ", error);
    throw error; 
  }
};

export const updateTaskStatus = async (taskid, donestatus) => {
  const db = await openDatabase();
  const today = new Date().toISOString().split('T')[0]; // Today's date in 'YYYY-MM-DD' format
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE task SET donestatus = ?, lastCompletedDate = ? WHERE taskid = ?',
        [donestatus, donestatus === 1 ? today : null, taskid],
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error updating task status:", error);
          reject(error);
        }
      );
    });
  });
};


export const updateFavoriteStatus = async (taskid, favorite) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE task SET favorite = ? WHERE taskid = ?',
        [favorite, taskid],
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error updating favorite status:", error);
          reject(error);
        }
      );
    });
  });
};

export const getTasksByDate = async (date) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM task WHERE duedate IS NOT NULL';
    const params = [];

    if (date) {
      query += ' AND duedate = ?';
      params.push(date);
    }

    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (tx, results) => {
          const tasks = [];
          for (let i = 0; i < results.rows.length; i++) {
            tasks.push(results.rows.item(i));
          }
          resolve(tasks);
        },
        (tx, error) => {
          console.error('Error fetching tasks by date:', error);
          reject(error);
        }
      );
    });
  });
};

export const updateTask = async (taskid, taskText, donestatus, favorite, alarm, duedate, repeatstatus, description) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE task 
         SET tasktext = ?, donestatus = ?, favorite = ?, alarm = ?, duedate = ?, repeatstatus = ?, description = ? 
         WHERE taskid = ?`,
        [taskText, donestatus, favorite, alarm, duedate, repeatstatus, description, taskid],
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error updating task:", error);
          reject(error);
        }
      );
    });
  });
};

export const resetDailyTasks = async () => {
  const db = await openDatabase();
  const today = new Date().toISOString().split('T')[0]; // Today's date in 'YYYY-MM-DD' format
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE task 
         SET donestatus = 0, lastCompletedDate = ?
         WHERE repeatstatus = 'Daily' AND (lastCompletedDate IS NULL OR lastCompletedDate < ?)`,
        [today, today],
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error resetting daily tasks:", error);
          reject(error);
        }
      );
    });
  });
};

export const resetWeeklyTasks = async () => {
  const db = await openDatabase();
  const today = new Date();
  const todayDay = today.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(); 
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE task 
         SET donestatus = 0, lastCompletedDate = ?
         WHERE repeatstatus LIKE ? AND (lastCompletedDate IS NULL OR lastCompletedDate < ?)`,
        [today.toISOString().split('T')[0], `%Weekly%${todayDay}%`, today.toISOString().split('T')[0]],
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error resetting weekly tasks:", error);
          reject(error);
        }
      );
    });
  });
};
export const resetMonthlyTasks = async () => {
  const db = await openDatabase();
  const today = new Date();
  const todayDate = today.getDate(); 

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE task 
         SET donestatus = 0, lastCompletedDate = ?
         WHERE repeatstatus LIKE ? AND (lastCompletedDate IS NULL OR lastCompletedDate < ?)`,
        [today.toISOString().split('T')[0], `%Monthly%${todayDate}%`, today.toISOString().split('T')[0]],
        (_, result) => {
          resolve(result);
        },
        (tx, error) => {
          console.error("Error resetting monthly tasks:", error);
          reject(error);
        }
      );
    });
  });
};

export const deleteTask = async (taskid) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM task WHERE taskid = ?',
        [taskid],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getTasksCount = async () => {
  const db = await openDatabase();
  const today = new Date(); // Today's date
  const formattedToday = format(today, "MMMM do, yyyy"); // Format: 'August 31st, 2024'

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT COUNT(*) as count FROM task WHERE donestatus = 0 AND duedate < ?`,
        [formattedToday],
        (tx, results) => {
          const count = results.rows.item(0).count;
          resolve(count);
        },
        (tx, error) => {
          console.error("Error getting tasks count:", error);
          reject(error);
        }
      );
    });
  });
};
