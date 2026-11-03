import session from "express-session";
import { TowtruckDatabase } from "../db/index.js";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * An express-session store that persists sessions in the Towtruck SQLite database,
 * so that sessions survive server restarts.
 */
export class SqliteSessionStore extends session.Store {
  #db;

  /**
   * @param {{ db?: TowtruckDatabase }} [options]
   */
  constructor({ db } = {}) {
    super();
    this.#db = db ?? new TowtruckDatabase();
    this.#db.deleteExpiredSessions();
  }

  #expiresAt(sess) {
    const expires = sess?.cookie?.expires;
    if (expires) return new Date(expires).getTime();
    return Date.now() + DEFAULT_TTL_MS;
  }

  get(sid, callback) {
    try {
      const record = this.#db.getSession(sid);
      if (!record) return callback(null, null);

      if (record.expiresAt <= Date.now()) {
        this.#db.deleteSession(sid);
        return callback(null, null);
      }

      return callback(null, record.session);
    } catch (err) {
      return callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      this.#db.saveSession(sid, sess, this.#expiresAt(sess));
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid, sess, callback) {
    this.set(sid, sess, callback);
  }

  destroy(sid, callback) {
    try {
      this.#db.deleteSession(sid);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }
}
