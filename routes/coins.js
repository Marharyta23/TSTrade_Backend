// routes/coins.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = "https://pro-api.coinmarketcap.com";
const API_KEY = "5334e46d-d8f9-46a1-842e-4e0a801e89f0";

const ONE_HOUR = 60 * 60 * 1000; // 1 час в миллисекундах

const cache = {};

/**
 * Получает данные из кэша, если они не устарели.
 * @param {string} key
 */
function getCached(key) {
  if (cache[key] && Date.now() - cache[key].timestamp < ONE_HOUR) {
    return cache[key].data;
  }
  return null;
}

/**
 * Сохраняет данные в кэш.
 * @param {string} key
 * @param {*} data
 */
function setCached(key, data) {
  cache[key] = { timestamp: Date.now(), data };
}

/**
 * Универсальная функция для запроса к CoinMarketCap API с кэшированием.
 * @param {string} endpoint - часть URL (например, "listings/latest", "info", "quotes/latest", "ohlcv/historical")
 * @param {object} params - параметры запроса
 */
async function fetchCMC(endpoint, params) {
  // Формируем ключ кэша на основе endpoint и параметров
  const queryString = new URLSearchParams(params).toString();
  const cacheKey = `${endpoint}?${queryString}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return cachedData;
  }
  console.log(`Cache miss for ${cacheKey}. Fetching from CoinMarketCap...`);
  const response = await axios.get(
    `${BASE_URL}/v1/cryptocurrency/${endpoint}`,
    {
      params,
      headers: { "X-CMC_PRO_API_KEY": API_KEY },
    }
  );
  setCached(cacheKey, response.data);
  return response.data;
}

// Маршрут для получения списка монет (листинг)
// Пример запроса: GET /api/coinmarketcap/listings/latest?start=1&limit=100&convert=USD
router.get("/listings/latest", async (req, res) => {
  try {
    const data = await fetchCMC("listings/latest", {
      start: req.query.start || 1,
      limit: req.query.limit || 100,
      convert: req.query.convert || "USD",
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Маршрут для получения информации (и/или иконок) по монете или монетам
// Пример запроса: GET /api/coinmarketcap/info?symbol=BTC,ETH
router.get("/info", async (req, res) => {
  try {
    const data = await fetchCMC("info", req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Маршрут для получения котировок для покупки/продажи
// Пример запроса: GET /api/coinmarketcap/quotes/latest?symbol=BTC
router.get("/quotes/latest", async (req, res) => {
  try {
    const data = await fetchCMC("quotes/latest", req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Маршрут для получения исторических данных (для построения графика)
// Пример запроса: GET /api/coinmarketcap/ohlcv/historical?symbol=BTC&time_start=...&time_end=...&convert=USD&interval=daily
router.get("/ohlcv/historical", async (req, res) => {
  try {
    const data = await fetchCMC("ohlcv/historical", req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
