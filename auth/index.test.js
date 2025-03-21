import { describe, it } from "node:test";
import expect from "node:assert";
import { User, getUser, saveUser, userExists } from "./index.js";
import { hash } from "node:crypto";

const db = {
    transaction: (fn) => {
      return (arg) => fn(arg);
    },
    getFromUser: () => {},
    getAllFromUser: () => {},
    saveToUser: () => {},
};

describe("User", () => {
    describe("passwordMatches", () => {
        it("returns false if the password is incorrect", () => {
            const unexpectedHash = hash("sha512", "salt-somepassword");
            const user = new User("some-user", [], "usernamePassword", "salt-", unexpectedHash);

            expect.strictEqual(user.passwordMatches("incorrectpassword"), false, "An incorrect password should not match.");
        });

        it("returns false if the password is correct but the salt is incorrect", () => {
            const unexpectedHash = hash("sha512", "moresalt-somepassword");
            const user = new User("some-user", [], "usernamePassword", "salt-", unexpectedHash);

            expect.strictEqual(user.passwordMatches("somepassword"), false, "A correct password should not match if the salt is incorrect.");
        });

        it("returns true if the password is correct and the salt is correct", () => {
            const expectedHash = hash("sha512", "salt-somepassword");
            const user = new User("some-user", [], "usernamePassword", "salt-", expectedHash);

            expect.strictEqual(user.passwordMatches("somepassword"), true, "A correct password and salt should match.");
        });
    });
});

describe("getUser", () => {
    it("returns undefined if user does not exist", (t) => {
        t.mock.method(db, "getFromUser", () => { undefined });

        const result = getUser(db, "unknown-user");

        expect.strictEqual(result, undefined, "A non-existent user should not return a result.");
    });
    it("returns the expected user details if the user exists", (t) => {
        t.mock.method(db, "getFromUser", () => "some-user");

        const expectedHash = hash("sha512", "salt-somepassword");
        t.mock.method(db, "getAllFromUser", (username) => ({
            username: username,
            orgs: ["some-org"],
            loginMethod: "usernamePassword",
            salt: "salt-",
            hashedPassword: expectedHash
        }));

        const expected = new User("some-user", ["some-org"], "usernamePassword", "salt-", expectedHash);

        const result = getUser(db, "some-user");

        expect.deepStrictEqual(result.username, expected.username);
        expect.deepStrictEqual(result.orgs, expected.orgs);
        expect.deepStrictEqual(result.loginMethod, expected.loginMethod);
        expect.deepStrictEqual(result.salt, expected.salt);
        expect.deepStrictEqual(result.hashedPassword, expected.hashedPassword);
    });
});

describe("saveUser", () => {
    it("saves the user details to the database", (t) => {
        t.mock.method(db, "transaction");
        t.mock.method(db, "saveToUser");

        const expectedHash = hash("sha512", "salt-somepassword");
        const user = new User("some-user", ["some-org"], "usernamePassword", "salt-", expectedHash);

        saveUser(db, user);

        expect.strictEqual(db.transaction.mock.callCount(), 1);

        expect.strictEqual(db.saveToUser.mock.callCount(), 5);

        expect.deepStrictEqual(db.saveToUser.mock.calls[0].arguments, [
            user.username,
            "username",
            user.username
        ]);
        expect.deepStrictEqual(db.saveToUser.mock.calls[1].arguments, [
            user.username,
            "orgs",
            user.orgs
        ]);
        expect.deepStrictEqual(db.saveToUser.mock.calls[2].arguments, [
            user.username,
            "loginMethod",
            user.loginMethod
        ]);
        expect.deepStrictEqual(db.saveToUser.mock.calls[3].arguments, [
            user.username,
            "salt",
            user.salt
        ]);
        expect.deepStrictEqual(db.saveToUser.mock.calls[4].arguments, [
            user.username,
            "hashedPassword",
            user.hashedPassword
        ]);
    });
});

describe("getUser", () => {
    it("returns false if user does not exist", (t) => {
        t.mock.method(db, "getFromUser", () => { undefined });

        const result = userExists(db, "unknown-user");

        expect.strictEqual(result, false);
    });

    it("returns true if the user exists", (t) => {
        t.mock.method(db, "getFromUser", () => "some-user");

        const result = userExists(db, "some-user");

        expect.strictEqual(result, true);
    });
});
