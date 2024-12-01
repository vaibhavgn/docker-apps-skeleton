const express = require('express');
const app = express();
const fs = require('fs');

const port = process.env.PORT || 3000;

app.use(express.json()); 

compiledJSON = {}

function readAndProcessJson() {
    const filePath = './data.json';
    
    try {

        const data = fs.readFileSync(filePath, 'utf8');
        

        const jsonData = JSON.parse(data);
        

        const processedJson = {};
        for (const key in jsonData) {
            processedJson[key.toUpperCase()] = jsonData[key]; 
        }
        
        return processedJson;
    } catch (error) {
        console.error('Error reading or processing JSON file:', error.message);
        return null;
    }
}

const result = readAndProcessJson();
console.log(result)




app.get('/getDataFromDb', async (req, res) => {


    res.send(compiledJSON)
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
