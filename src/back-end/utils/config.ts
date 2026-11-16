import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Récupérer le token d'accès à l'API TMDB depuis les variables d'environnement
const configuredTmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;

if (!configuredTmdbAccessToken) {
  throw new Error(
    'TMDB_ACCESS_TOKEN is not defined in the environment variables.',
  );
}

const tmdbAccessToken: string = configuredTmdbAccessToken;

export { tmdbAccessToken };
