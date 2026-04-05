import "dotenv/config"
import cors from 'cors'
import express from 'express'

import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import pantryRoutes from "./routes/pantryRoutes.js"
import recipeRoutes from "./routes/recipeRoutes.js"
import mealRoutes from "./routes/mealRoutes.js"
import shoppingListRoutes from "./routes/shoppingListRoutes.js"

const app = express();

//Middleware
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/' , (req , res) => {
    res.json({message: 'API Working'});
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/meal-plans', mealRoutes);
app.use('/api/shopping-list', shoppingListRoutes)

const PORT = process.env.PORT || 8000;

app.listen(PORT , () => {
    console.log(`Server Running on Port ${PORT}`)
})

export default app;
