const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000
const multer = require('multer');

require('dotenv').config();
const upload = multer({ storage: multer.memoryStorage() });

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
      try {
        const newUser = req.body;

        if (!newUser.email) {
          return res.status(400).send({ message: 'Email is required' });
        }

        const existingUser = await usersCollection.findOne({ email: newUser.email });
        if (existingUser) {
          return res.status(409).send({ message: 'User already exists' });
        }

        const userToSave = {
          name: newUser.name || "",
          email: newUser.email,
          photoURL: newUser.photoURL || "",
          uid: newUser.uid || "",

          status: "active",
          role: "user",

          createdAt: new Date()
        };

        const result = await usersCollection.insertOne(userToSave);
        res.status(201).send(result);

      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to create user' });
      }
    });


    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;

      const result = await usersCollection.findOne({
        _id: new ObjectId(id)
      });

      res.send(result);
    });


    // update user role
    app.patch("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { role, status } = req.body;

        const updateDoc = {};

        if (role) updateDoc.role = role;
        if (status) updateDoc.status = status;

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateDoc }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Update failed" });
      }
    });



    // meals API
    app.post('/meals', async (req, res) => {
      const meal = req.body;
      const result = await allMeals.insertOne(meal);
      res.send(result);
    });


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

    // get meals by chef
    app.get("/my-meals", async (req, res) => {
      const email = req.query.email;
      const meals = await allMeals.find({ userEmail: email }).toArray();
      res.send(meals);
    });

    // delete meal by chef
    app.delete("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const result = await allMeals.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
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

    // get orders for specific chef
    app.get("/chef-orders/:chefId", async (req, res) => {
      const chefId = req.params.chefId;
      const orders = await orderCollection.find({ chefId }).toArray();
      res.send(orders);
    });

    // update order status
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const result = await orderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      res.send(result);
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
