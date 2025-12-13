const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const reviewsCollection = LocalChefBazaarDB.collection('reviews');
    const orderCollection = LocalChefBazaarDB.collection('orders');
    const favoriteCollection = LocalChefBazaarDB.collection('favorites');


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

    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    // meals API
    app.post('/meals', async (req, res) => {
      const newMeal = req.body;
      const result = await allMeals.insertOne(newMeal);
      res.send(result);
    })

    app.get('/meals', async (req, res) => {
      const cursor = allMeals.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const meal = await allMeals.findOne({ _id: new ObjectId(id) });
        if (!meal) {
          return res.status(404).send({ message: "Meal not found" });
        }
        res.send(meal);
      } catch (err) {
        res.status(500).send({ error: "Server error" });
      }
    });

    // reviews api
    app.post('/reviews', async (req, res) => {
      const newReview = req.body;
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result);
    });

    app.get('/reviews', async (req, res) => {
      const cursor = reviewsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/reviews/:foodId", async (req, res) => {
      const foodId = req.params.foodId;
      try {
        const reviews = await reviewsCollection.find({ foodId }).toArray();
        res.send(reviews);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
    });

    // Update a review
    app.put('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const updatedReview = req.body;
      const result = await reviewsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedReview });
      res.send(result);
    });

    // Delete a review
    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Orders API
    app.post("/orders", async (req, res) => {
      try {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to place order" });
      }
    });

    app.get("/orders", async (req, res) => {
      try {
        const orders = await orderCollection.find().toArray();
        res.send(orders);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch orders" });
      }
    });

    // Get orders by user email
    app.get("/orders/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const orders = await orderCollection.find({ userEmail: email }).toArray();
        res.send(orders);
      } catch (error) {
        res.status(500).send({ message: "Error fetching user orders" });
      }
    });

    // Favorites API
    app.post("/favorites", async (req, res) => {
      try {
        const favorite = req.body;
        const result = await favoriteCollection.insertOne(favorite);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to add favorite" });
      }
    });

    // Get all favorites
    app.get("/favorites", async (req, res) => {
      try {
        const favorites = await favoriteCollection.find().toArray();
        res.send(favorites);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch favorites" });
      }
    });

    // Delete a favorite
    app.delete("/favorites/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await favoriteCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to delete favorite" });
      }
    });

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
