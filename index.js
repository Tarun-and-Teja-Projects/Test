const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://prabhuteja:Prabhu%40985@cluster0.vx0ft.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

const PORT = 3000;

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("admin");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}




connectToMongoDB().catch(console.error);

app.get('/',(req,res)=>{
    res.json({
        status:200,
        message:"Working Server"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
