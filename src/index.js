const express = require('express');
const fetch = require('node-fetch');

const app = express();

const BASE_URL = 'https://api.themoviedb.org/3';
const SUPER_SECRET_API_KEY = process.env.API_KEY;

let apiConfig = null;

const getFromApi = async url => {
  console.time('EXTERNAL_API_REQUEST');
  const result = await fetch(
    `${BASE_URL}${url}${
      url.includes('?') ? '&' : '?'
    }api_key=${SUPER_SECRET_API_KEY}`,
  );
  const json = await result.json();
  console.timeEnd('EXTERNAL_API_REQUEST');
  return json;
};

const apiCache = {};
const cachedGet = async url => {
  const cachedResult = apiCache[url];
  if (cachedResult) {
    console.log(`Cache hit! returning cached result for ${url}...`);
    return Promise.resolve(cachedResult);
  }
  console.log(`No hit for ${url}. Fetching data from ${BASE_URL}${url} ...`);
  const json = getFromApi(url);
  apiCache[url] = json;
  console.log(`Cached ${url}, returning`);

  return json;
};

// Enable cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

// Fetch the most popular movies right now!
app.get('/', async (req, res) => {
  const apiResponse = await cachedGet(
    '/discover/movie?sort_by=popularity.desc',
  );
  res.json(
    apiResponse.results.map(movie => ({
      ...movie,
      poster_path: `${apiConfig.images.secure_base_url}w500${
        movie.poster_path
      }`,
      backdrop_path: `${apiConfig.images.secure_base_url}w1280${
        movie.backdrop_path
      }`,
    })),
  );
});
app.get('/:id', async (req, res) => {
  const apiResponse = await cachedGet(`/movie/${req.params.id}`);
  res.json({
    ...apiResponse,
    poster_path: `${apiConfig.images.secure_base_url}w500${
      apiResponse.poster_path
    }`,
    backdrop_path: `${apiConfig.images.secure_base_url}w1280${
      apiResponse.backdrop_path
    }`,
  });
});

// This fetches the configuration and starts the server
const start = async () => {
  console.log('Loading API configuration');
  apiConfig = await getFromApi('/configuration');
  console.log('API configuration loaded successfully');

  app.listen(8000, () => console.log('API is open and ready for business!'));
};

start();
