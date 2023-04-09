const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(express.json());

dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running in http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error in ${e.message}`);
  }
};

initializeDbAndServer();

//Register API-1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const SelectUserQuery = `
 SELECT *
            FROM user
            WHERE username = '${username}';`;
  const dbUser = await db.get(SelectUserQuery);
  if (password === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      //create new user
      const createUserQuery = `INSERT INTO 
      user(username,name,password,gender,location)
      VALUES 
      ('${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}');`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User Created Successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API-2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const SelectUserQuery = `
 SELECT *
            FROM user
            WHERE username = '${username}';`;
  const dbUser = await db.get(SelectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const SelectUserQuery = `
 SELECT *
            FROM user
            WHERE username = '${username}';`;
  const dbUser = await db.get(SelectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isValid = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValid === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
             update user
             SET password='${encryptedPassword}'
             WHERE username ='${username}';`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
