const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://prabhuteja:Prabhu%40985@cluster0.vx0ft.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}

connectToMongoDB().catch(console.error);

app.get('/', (req, res) => {
    res.json({
        status: 200,
        message: "Working Server"
    });
});

app.post("/api/data", async (req, res) => {
    try {
        const db = client.db("mydatabase"); // Use a different database than admin
        const collection = db.collection("Contact");

        // Destructure properties from req.body
        const { name, email, message } = req.body;

        // Validate the request body
        if (!name || !email || !message) {
            return res.status(400).send("Missing required fields: name, email, and message");
        }

        // Create the data object to insert
        const data = {
            name,
            email,
            message,
            createdAt: new Date()
        };

        // Insert the data into the collection
        const result = await collection.insertOne(data);
        res.status(201).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to insert data");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
