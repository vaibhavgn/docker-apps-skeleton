const express = require('express');
const app = express();
const fs = require('fs');
const mongoose = require('mongoose');
const Data = require('./models/data');

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

app.use(express.json());

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Exit the process if MongoDB connection fails
    });

app.post('/processData', async (req, res) => {
    try {
        // Ensure the file exists before reading
        const filePath = './data.json';
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({
                success: false,
                message: 'The data file does not exist.',
            });
        }

        // Read and parse the JSON file
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        // Validate the structure of the input data
        if (!jsonData || typeof jsonData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or empty data structure.',
            });
        }

        // Process the data to match the required format (convert keys to uppercase)
        const processedJson = {
            popularityPercentages: {
                news: jsonData.popularityPercentages?.news || [],
                socialMedia: jsonData.popularityPercentages?.socialMedia || [],
            },
            latestPercentChanges: jsonData.latestPercentChanges || {},
            chartData: jsonData.chartData || {},
        };

        // Optional: Log the processed data to verify
        console.log('Processed JSON:', processedJson);

        // Create a new Data document and save it to MongoDB
        const newData = new Data(processedJson);
        await newData.save();

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Processed data saved to MongoDB successfully.',
        });
    } catch (error) {
        // Improved error handling
        console.error('Error during data processing:', error.message);

        res.status(500).json({
            success: false,
            message: 'An error occurred while processing or saving data.',
            error: error.message,
        });
    }
});


// Route to fetch data from MongoDB
app.get('/getDataFromDb', async (req, res) => {
    try {
        // Fetch all data from MongoDB
        const data = await Data.findOne({});

        // Check if no data is found
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data found in the database.',
            });
        }

        // Send the data as JSON response
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching data from MongoDB:', err.message);

        // Send error response with status 500 for server errors
        res.status(500).json({
            success: false,
            message: 'Error fetching data from the database.',
            error: err.message,
        });
    }
});


app.get('/', async (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
