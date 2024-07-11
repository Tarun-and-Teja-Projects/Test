const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cors = require('cors');

const uri = "mongodb+srv://prabhuteja:Prabhu%40985@cluster0.vx0ft.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const ACCESS_TOKEN_SECRET = crypto.randomBytes(64).toString('hex');

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}
connectToMongoDB().catch(console.error);
function generateAccessToken(user) {
    return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).send("Access token is required");

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid token");
        req.user = user;
        next();
    });
}

function authorizePermission(permission) {
    return async (req, res, next) => {
        const roleId = req.body.roles;
        if (!roleId) {
            return res.status(403).send("Role ID is required to perform this action");
        }
        try {
            const db = client.db("mydatabase");
            const rolesCollection = db.collection("roles");
            const roleObjectId = new ObjectId(roleId);
            const role = await rolesCollection.findOne({ _id: roleObjectId });
            if (!role) {
                return res.status(403).send("Role is invalid or does not exist");
            }
            const permissions = role.permissions;
            if (!permissions.includes(permission)) {
                return res.status(403).send(`Role does not have permission to ${permission}`);
            }
            req.userRole = role;
            next();
        } catch (err) {
            console.error(err);
            res.status(500).send("Failed to authorize permission");
        }
    };
}

app.post('/api/roles', authenticateToken, authorizePermission('create_role'), async (req, res) => {
    try {
        const db = client.db("mydatabase");
        const rolesCollection = db.collection("roles");
        const { name, permissions } = req.body;
        if (!name || !permissions) {
            return res.status(400).send("Role name and permissions are required");
        }
        const newRole = {
            name,
            permissions
        };
        const result = await rolesCollection.insertOne(newRole);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to create role");
    }
});

app.post('/api/users/:userId/roles', authenticateToken, authorizePermission('assign_role'), async (req, res) => {
    try {
        const db = client.db("mydatabase");
        const usersCollection = db.collection("users");

        const { roles } = req.body;
        const { userId } = req.params;

        if (!roles) {
            return res.status(400).send("Roles are required");
        }

        const result = await usersCollection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { roles } }
        );

        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to assign roles");
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const db = client.db("mydatabase");
        const usersCollection = db.collection("users");

        const { username, password, roles } = req.body;

        if (!username || !password) {
            return res.status(400).send("Username and password are required");
        }


        const newUser = {
            username,
            password: password,
            roles: roles || []
        };

        const result = await usersCollection.insertOne(newUser);
        console.log(result);

        res.status(201).send("User registered successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to register user");
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const db = client.db("mydatabase");
        const usersCollection = db.collection("users");

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send("Username and password are required");
        }

        const user = await usersCollection.findOne({ username });

        if (!user) {
            return res.status(401).send("Invalid username or password");
        }

        if (password !== user.password) {
            return res.status(401).send("Invalid username or password");
        }

        const accessToken = generateAccessToken({ username: user.username, roles: user.roles });
        res,json({
            status:200,
            data:accessToken
        })
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to login");
    }
});


app.post('/api/data', authenticateToken, authorizePermission('write'), async (req, res) => {
    try {
        const db = client.db("mydatabase");
        const collection = db.collection("Contact");

        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).send("Missing required fields: name, email, and message");
        }
        const data = {
            name,
            email,
            message,
            createdAt: new Date()
        };

        const result = await collection.insertOne(data);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to insert data");
    }
});

app.post('/api/addMission',async(req,res)=>{
    try {
        const db = client.db("mydatabase");
        const collection = db.collection("mission");

        const { title, description, Image } = req.body;

        if (!title || !description) {
            return res.status(400).send("Missing required fields: title, description, and Image");
        }
        const data = {
            title,
            description,
            Image,
            createdAt: new Date()
        };

        const result = await collection.insertOne(data);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to insert data");
    }
});

app.get('/api/getMission', async (req, res) => {
    try {
      const db = client.db("mydatabase");
      const collection = db.collection("mission");
  
      const missions = await collection.find({}).toArray();
      res.json(missions);
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to fetch missions");
    }
  });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
