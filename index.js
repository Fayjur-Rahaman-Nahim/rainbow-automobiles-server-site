const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1qdkw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('rainbowAutomobilesDB');
        const productsCollection = database.collection('products');
        const purchaseCollection = database.collection('purchase');
        const reviewsCollection = database.collection('reviews');
        const userCollection = database.collection('users');

        //GET API
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        //GET Single Product
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        });

        //Delete Product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        })

        //POST API
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        });

        //Add order API
        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase);
            res.json(result);
        });

        //use POST to Get data by email
        app.post('/purchase/byEmail', async (req, res) => {
            const email = req.body.email
            const query = { email: email };
            const cursor = await purchaseCollection.find(query);
            const result = await cursor.toArray();
            res.json(result);
        })

        //Get all Purchase Products
        app.get('/purchase', async (req, res) => {
            const cursor = purchaseCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        //update purchase status by admin
        app.put('/purchase/:id', async (req, res) => {
            const productId = req.params.id;
            const status = req.body.status;
            const filter = { _id: ObjectId(productId) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: status
                },
            };
            const result = await purchaseCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        })

        //DELETE API
        app.delete('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchaseCollection.deleteOne(query);
            res.json(result);
        })

        //Get all Review
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        //Add Review API
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });

        //UPDATE user and set admin role
        app.put('/users/admin/:email', async (req, res) => {
            const makeNewAdmin = req.body;
            const requester = req.params.email;

            if (requester) {
                const requesterAccount = await userCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: makeNewAdmin.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make Admin' })
            }
        })

        // GET User Check admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        //Insert User to DB
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to Rainbow Automobiles Website')
})

app.listen(port, () => {
    console.log(" listening at", port)
})

