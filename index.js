import dotenv from 'dotenv';
import axios from 'axios';
import OpenAI from 'openai';
import readline from 'readline-sync';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STOCK_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const STOCK_API_URL = "https://www.alphavantage.co/query";

// Function to fetch real-time stock price from Alpha Vantage
async function fetchStockPrice(symbol) {
    try {
        const response = await axios.get(STOCK_API_URL, {
            params: {
                function: "TIME_SERIES_INTRADAY",
                symbol: symbol,
                interval: "5min",
                apikey: STOCK_API_KEY
            }
        });

        const timeSeries = response.data["Time Series (5min)"];
        if (!timeSeries) return "⚠️ Invalid stock symbol or API limit reached.";

        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];

        return `📊 **Stock: ${symbol}**\n📅 Time: ${latestTime}\n📈 Open: $${latestData["1. open"]}\n📉 High: $${latestData["2. high"]}\n🔻 Low: $${latestData["3. low"]}\n💰 Close: $${latestData["4. close"]}\n📊 Volume: ${latestData["5. volume"]}`;
    } catch (error) {
        return "❌ Error fetching stock data: " + error.message;
    }
}

// Function to extract stock symbols using OpenAI
async function extractStockSymbol(userInput) {
    const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: `Extract the stock symbol from this query: "${userInput}"` }],
    });

    return aiResponse.choices[0].message.content.trim().toUpperCase();
}

// Function to process user query
async function aiAgent(userInput) {
    console.log("\n🤖 AI Processing your query...");
    
    const extractedSymbol = await extractStockSymbol(userInput);
    console.log("🔍 AI Identified Stock Symbol:", extractedSymbol);

    if (!extractedSymbol.match(/^[A-Z]+$/)) {
        console.log("⚠️ Could not determine a valid stock symbol. Please try again.");
        return;
    }

    const stockInfo = await fetchStockPrice(extractedSymbol);
    console.log("\n📈 **Stock Market Data:**\n", stockInfo);
}

// Run the AI Stock Price Agent
async function startAgent() {
    console.log("💡 AI Stock Price Agent (Powered by OpenAI + Alpha Vantage)");
    const userQuery = readline.question("Ask about a stock price (e.g., 'What's the price of AAPL?'): ");
    await aiAgent(userQuery);
}

startAgent();
