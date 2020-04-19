require("dotenv").config();
const path = require("path");
const express = require("express");
const oracledb = require("oracledb");
const bodyParser = require("body-parser");

// database handler
let connection;

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}))

// serve static files
app.use(express.static(path.join(__dirname, "public")));

// setup server
const PORT = 5000 || process.env.PORT;
app.listen(PORT, () => console.log(`server started on port: ${PORT}`));

// home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// submission route
app.post("/submit", async (req, res) => {

    const data = req.body;

    try {
        await connection.execute(
            `INSERT INTO consultation (first_name, last_name, address, email)
             VALUES ('${data.firstname}', '${data.lastname}', '${data.address}', '${data.email}')
            `
        );
    } catch (err) {
        console.log(err);
    }
    
    res.redirect("/");
})


// setup database connection
async function initDB() {
    oracledb.autoCommit = true;

    try {
      connection = await oracledb.getConnection(  {
        user          : process.env.DB_USER,
        password      : process.env.DB_PASSWORD,
      });
    
      // create table if not exists
      await connection.execute(
       `CREATE TABLE consultation(
            id NUMBER(11), 
            first_name VARCHAR2(25) NOT NULL,
            last_name VARCHAR2(25) NOT NULL,
            address VARCHAR2(255) NOT NULL,
            email VARCHAR2(255) NOT NULL,
            CONSTRAINT consultation_pk PRIMARY KEY(id)
       )`
      );
    
    //   create sequence
      await connection.execute(
          "CREATE SEQUENCE consultation_seq"
      );
    
    //   create trigger
      await connection.execute(
          `CREATE OR REPLACE TRIGGER consult_bir
            before insert on consultation
            for each row
            begin
                select consultation_seq.NEXTVAL
                into :new.id
                from dual;
            end;`
      )

     
      
    } catch (err) {
        console.error(err);
    }

    console.log("DATABASE CONNECTION HAS BEEN ESTABLISHED");
}
  
initDB();
