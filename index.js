const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000

require('dotenv').config();

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.lp1xwc5.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Server is running')
})

app.post('/data', (req, res) => {
  const receivedData = req.body
  res.json({ message: 'Data received successfully', data: receivedData })
})


// MongoDB API
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const LocalChefBazaarDB = client.db('LocalChefBazaarDB');
    const usersCollection = LocalChefBazaarDB.collection('users');
    const allMeals = LocalChefBazaarDB.collection('meals');


    // users API
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            // const email = req.body.email;
            // const quary = { email: email }
            // const existingUser = await usersCollection.findOne(quary);
            // if (existingUser) {
                // res.send('Already have user.')
            // }
            // else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            // }
        })


        // meals API
        app.post('/meals', async (req, res) => {
            const newMeal = req.body;
            const result = await allMeals.insertOne(newMeal);
            res.send(result);
        })

        app.get('/meals', async (req, res) => {
            const cursor = allMeals.find().limit(6).sort({ date: 1 });
            const result = await cursor.toArray();
            res.send(result);
        })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
