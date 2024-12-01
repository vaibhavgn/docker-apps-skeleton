const express = require('express');
const axios = require('axios');
const moment = require('moment');
const mongoose = require('mongoose'); // need mongoose to connect to MongoDB
const Data = require('./models/data'); // Import the model from data.js

const API_KEY = "83039eaf-0bed-468c-90fe-eda73809957e";
const URL  = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";
const URL_Quotes = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest"
const mongoURI = process.env.MONGO_URI; // get connection string from docker-compose using the environment variable

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
      process.exit(1); // Exit the process if MongoDB connection fails
  });

let chartData = {};
let popularityPercentages = {};

app.use(express.json()); 

app.get('/runGrowthService', async (req, res) => {
    // res.send("Growth Service activated, updating prices");
    const tickers = [
        "X:BTCUSD", "X:ETHUSD", "X:SOLUSD", 
        "X:XRPUSD", "X:DOGEUSD", "X:ADAUSD", "X:TRXUSD", 
        "X:SHIBUSD", "X:AVAXUSD", "X:TONUSD"
    ];

    for (const ticker of tickers) {
        await getChartData(ticker); 
        await delay(12000); 
    }

    //scraping based processing
    exampleJson = {
        "news1_and_news2": {
            "X:BTCUSD": 20,
            "X:ETHUSD": 32,
            "X:SOLUSD": 43,
            "X:XRPUSD": 9,
            "X:DOGEUSD": 15,
            "X:ADAUSD": 25,
            "X:TRXUSD": 18,
            "X:SHIBUSD": 12,
            "X:AVAXUSD": 30,
            "X:TONUSD": 22
        },
        "socialMedia": {
            "X:BTCUSD": 50,
            "X:ETHUSD": 45,
            "X:SOLUSD": 33,
            "X:XRPUSD": 27,
            "X:DOGEUSD": 19,
            "X:ADAUSD": 23,
            "X:TRXUSD": 16,
            "X:SHIBUSD": 11,
            "X:AVAXUSD": 29,
            "X:TONUSD": 21
        }
    }
    popularityPercentages = popularityBasedOnScrapping(exampleJson)    
    latestPercentChanges = await getLatestPercentageChange()
    compiledJSON = {}
    compiledJSON["popularityPercentages"] = popularityPercentages
    compiledJSON["latestPercentChanges"] = latestPercentChanges
    compiledJSON["chartData"] = chartData

    const newData = new Data(compiledJSON);
    // Save the data to MongoDB
    try {
        await newData.save();  // Save the new data document to the MongoDB database
        console.log("Data saved to MongoDB");
    } catch (error) {
        console.error("Error saving data to MongoDB:", error);
        return res.status(500).json({ error: 'Failed to save data to MongoDB' });
    }
    // res.status(200).send("Data saved successfully.");
    res.json(compiledJSON)
});

function popularityBasedOnScrapping(data){
    const processPopularity = (category) => {
        const total = Object.values(category).reduce((sum, count) => sum + count, 0);
        return Object.entries(category)
            .map(([key, count]) => ({ key, count, popularity: ((count / total) * 100).toFixed(2) + "%" }))
            .sort((a, b) => b.count - a.count);
    };
    
    const result = {
        news1_and_news2: processPopularity(data.news1_and_news2),
        socialMedia: processPopularity(data.socialMedia)
    };
    
    console.log(result);
    return result;
}


async function getChartData(ticker) {
    let timePrice = [];
    let timeVolume = [];
    let maxVolume = 0;

    const currentDate = moment();
    const fromDate = currentDate.clone().subtract(6, 'months').subtract(3, 'days');
    const apiURL = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fromDate.format("YYYY-MM-DD")}/${currentDate.format("YYYY-MM-DD")}?adjusted=true&sort=asc&apiKey=YzLOupt6B9xcE91frptcCxsRG0QVEI3v`;

    try {
        const response = await axios.get(apiURL);

        if (response.status === 200) {
            const data = response.data;
            const candleInfo = data.results;

            for (let i = 0; i < candleInfo.length; i++) {
                timePrice.push([candleInfo[i].t, candleInfo[i].c]);
                timeVolume.push([candleInfo[i].t, candleInfo[i].v]);
                if (candleInfo[i].v > maxVolume) {
                    maxVolume = candleInfo[i].v;
                }
            }

            chartData[ticker] = {
                ticker,
                timePrice,
                timeVolume
            };
        } else {
            console.error(`Error fetching data for ${ticker}:`, response.status);
        }
    } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error.message);
    }
}


async function getLatestPercentageChange(){
    const query = {
        symbol: "BTC,ETH,SOL,XRP,DOGE,ADA,TRX,SHIB,AVAX,TON", // Default to Bitcoin if no ID is provided
        convert: 'USD', // Default to USD if not provided
    };
  
    try {
        const response = await axios.get(URL_Quotes, {
            params: query,
            headers: {
                'X-CMC_PRO_API_KEY': API_KEY,
            },
        });
  
        // Process the response to include only `symbol` and `quote` (first entry per cryptocurrency)
        const filteredData = {};
        const data = response.data.data;
  
        for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
                // Extract the first entry from the array
                const firstEntry = data[key][0];
                filteredData[firstEntry.symbol] = {
                    symbol: firstEntry.symbol,
                    quote: firstEntry.quote,
                };
            }
        }
  
        // Send the filtered response to the client
       return filteredData;
    } catch (error) {
        console.error('Error fetching Quotes Latest data:', error.message);
        // const status = error.response?.status || 500;
        // res.status(status).json({
        //     error: error.response?.data || 'Failed to fetch data from CoinMarketCap.',
        // });
    }
}





function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});