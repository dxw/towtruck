import { hash } from "crypto";

export class User {
    #username;
    #orgs;
    #loginMethod;
    #salt;
    #hashedPassword;

    /**
     * 
     * @param {string} username 
     * @param {string[]} orgs 
     * @param {"usernamePassword" | "github"} loginMethod
     * @param {string?} salt
     * @param {string?} hashedPassword
     */
    constructor(username, orgs, loginMethod, salt, hashedPassword) {
        this.#username = username;
        this.#orgs = orgs;
        this.#loginMethod = loginMethod;
        this.#salt = salt;
        this.#hashedPassword = hashedPassword;
    }

    /**
     * @returns {string}
     */
    get username() { return this.#username; }

    /**
     * @returns {string[]}
     */
    get orgs() { return this.#orgs; }

    /**
     * @returns {"usernamePassword" | "github"}
     */
    get loginMethod() { return this.#loginMethod; }

    /**
     * @returns {string?}
     */
    get salt() { return this.#salt }

    /**
     * @returns {string?}
     */
    get hashedPassword() { return this.#hashedPassword; }

    /**
     * 
     * @param {string} candidatePassword 
     * @returns {boolean}
     */
    passwordMatches(candidatePassword) {
        const hashedCandidatePassword = hash("sha512", `${this.salt}${candidatePassword}`);

        return hashedCandidatePassword === this.#hashedPassword;
    }
}

/**
 * 
 * @param {import("../db/index.js").TowtruckDatabase} db 
 * @param {string} username 
 * @returns {User}
 */
export const getUser = function (db, username) {
    if (!userExists(db, username)) {
        return undefined;
    }

    const user = db.getAllFromUser(username);

    return new User(user.username, user.orgs, user.loginMethod, user.salt, user.hashedPassword);
}

/**
 * 
 * @param {import("../db/index.js").TowtruckDatabase} db 
 * @param {User} user 
 */
export const saveUser = function (db, user) {
    db.transaction(() => {
        db.saveToUser(user.username, "username", user.username);
        db.saveToUser(user.username, "orgs", user.orgs);
        db.saveToUser(user.username, "loginMethod", user.loginMethod);
        db.saveToUser(user.username, "salt", user.salt);
        db.saveToUser(user.username, "hashedPassword", user.hashedPassword);
    })();
}

/**
 * 
 * @param {import("../db/index.js").TowtruckDatabase} db 
 * @param {string} username 
 * @returns {boolean}
 */
export const userExists = function (db, username) {
    const data = db.getFromUser(username, "username");

    return data !== undefined;
}
