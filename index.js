const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yea90.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'unAuthorized' });
    }
    const token = authorization.split(' ')[1];
    // console.log(authorization);
    // console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        console.log(decoded)
        if (err) {
            // console.log(err);
            return res.status(403).send({ message: "Forbidden access" })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        await client.connect();
        const collection = client.db("menufacturer").collection("products");
        const userCollection = client.db("menufacturer").collection("user");
        const cartCollection = client.db("menufacturer").collection("cart");
        const paymentCollection = client.db("menufacturer").collection("payment");
        const reviewCollection = client.db("menufacturer").collection("review");
        const profileCollection = client.db("menufacturer").collection("profile");
        // console.log("raju");

        app.post('/addproduct', async (req, res) => {
            const addproduct = req.body;
            // console.log(review);
            const result = await collection.insertOne(addproduct);
            res.send(result);
        });

        app.put('/profile/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const profile = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: profile,
            };
            const result = await profileCollection.updateOne(filter, updateDoc, options);
            // const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d' })
            res.send(result);
        })

        app.get('/profile/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await profileCollection.findOne(query);
            res.send(result);
        });

        app.post('/review', async (req, res) => {
            const review = req.body;
            console.log(review);
            const result = await reviewCollection.insertOne(review);
            // const result = { stutaus: "success" }
            res.send(result);
        });


        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);

        })

        app.get('/products', async (req, res) => {


            const query = {};
            const cursor = collection.find(query);
            const products = await cursor.toArray();
            res.send(products);

        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await collection.findOne(query);
            res.send(result);
        });

        app.get('/user', async (req, res) => {
            const query = {};
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
        })

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const requesterAccount = await userCollection.findOne({ email: email });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send({ result });
            }
            else {
                res.status(403).send({ message: 'forbiden' });
            }

        })
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            console.log(email);
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d' })
            res.send({ result, token });
        })

        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const qurey = { _id: ObjectId(id) };
            const payment = await cartCollection.findOne(qurey);
            res.send(payment);

        })

        app.post('/cart', async (req, res) => {
            // const email = req.params.email;
            const cartItem = req.body;
            const result = await cartCollection.insertOne(cartItem);
            // const result = { stutaus: "success" }
            res.send(result);
        })

        app.get('/cart', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = cartCollection.find(query);
                const products = await cursor.toArray();
                return res.send(products);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }



        })

        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            if (amount) {
                console.log(amount);

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card']
                });
                res.send({ clientSecret: paymentIntent.client_secret })
            }
        })

        app.patch('/cart/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateBooking = await cartCollection.updateOne(filter, updateDoc);
            const result = await paymentCollection.insertOne(payment);
            res.send(updateDoc);
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