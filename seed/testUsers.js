import { hash } from "crypto";
import { User, saveUser } from "../auth/index.js";
import { TowtruckDatabase } from "../db/index.js"

const seed = async () => {
    const db = new TowtruckDatabase();

    const users = [
        new User("test-user-1", ["dxw"], "usernamePassword", "test-salt-1", hash("sha512", "test-salt-1mypassword")),
        new User("test-user-2", [], "usernamePassword", "test-salt-2", hash("sha512", "test-salt-2mypassword")),
        new User("test-user-3", ["dxw", "another-org"], "usernamePassword", "test-salt-3", hash("sha512", "test-salt-3someotherpassword")),
        new User("github-user", ["dxw"], "github")
    ]

    for (const user of users) {
        saveUser(db, user);
    }
};

await seed();
