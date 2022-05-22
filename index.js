const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://menufacturer:ZjM4qXcL0ykku0Ca@cluster0.yea90.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const collection = client.db("menufacturer").collection("products");
        console.log("raju");

        app.get('/products', async (req, res) => {


            const query = {};
            const cursor = collection.find(query);
            let products;
            // if (page || quantity) {
            //     products = await cursor.skip((page - 1) * quantity).limit(quantity).toArray();
            // } else {
            products = await cursor.toArray();

            // }
            console.log("products");
            res.send(products);

        })




    }
    finally {

    }
}
run().catch(console.dir);









app.get('/', (req, res) => {
    console.log("menuffacturer is running")
    res.send("menuffacturer is okay");
});
app.listen(port, () => {
    console.log("menuffacturer running on :", port)
});