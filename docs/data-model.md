# Modèle de données du tableau de bord des films

Le modèle représente un échantillon de films TMDB destiné à être comparé par
année de sortie, genre et pays de production.

## MCD

```mermaid
erDiagram
    MOVIE {
        int id PK
        string title
        string original_title
        string original_language
        text overview
        date release_date
        int release_year "derivee de release_date"
        decimal popularity
        decimal vote_average
        int vote_count
        string poster_path
        string backdrop_path
        int runtime_minutes
        int budget
        int revenue
        datetime collected_at
    }

    GENRE {
        int id PK
        string name
    }

    COUNTRY {
        string code PK
        string name
    }

    MOVIE_GENRE {
        int movie_id PK, FK
        int genre_id PK, FK
    }

    PRODUCTION_COUNTRY {
        int movie_id PK, FK
        string country_code PK, FK
    }

    MOVIE ||--o{ MOVIE_GENRE : "est classe dans"
    GENRE ||--o{ MOVIE_GENRE : "classe"
    MOVIE ||--o{ PRODUCTION_COUNTRY : "est produit dans"
    COUNTRY ||--o{ PRODUCTION_COUNTRY : "participe a"
```

Un film peut avoir zéro ou plusieurs genres et zéro ou plusieurs pays de
production. Un genre ou un pays peut être associé à zéro ou plusieurs films.
Les tables d'association représentent ces relations plusieurs-à-plusieurs.
L'identifiant TMDB d'un genre et le code d'un pays identifient les entrées de
catalogue ; le libellé n'est pas une clé.

Les notes, le nombre de votes, la popularité, la durée, le budget et les
recettes restent inconnus lorsqu'ils ne sont pas fournis. Une durée, un budget
ou une recette inconnus sont stockés à `NULL` ; lorsqu'ils sont présents, ils
sont strictement positifs. `release_year` est dérivée de `release_date` pour
faciliter les agrégations et les filtres par année.

Une actualisation conserve une seule ligne par film TMDB et remplace ses
associations de genres et de pays. `collected_at` correspond à la dernière
observation. Les clés étrangères garantissent que les associations pointent
vers des films et des entrées de catalogue existants.

## Schéma relationnel

```text
movies(
  id PK, title, original_title, original_language, overview, release_date,
  release_year, popularity, vote_average, vote_count, poster_path,
  backdrop_path, runtime_minutes, budget, revenue, collected_at
)

genres(id PK, name)
countries(code PK, name)
movie_genres(movie_id PK/FK -> movies.id, genre_id PK/FK -> genres.id)
production_countries(
  movie_id PK/FK -> movies.id,
  country_code PK/FK -> countries.code
)
```

Les clés primaires composites de `movie_genres` et `production_countries`
empêchent les doublons d'association. La suppression d'un film supprime ses
associations ; les entrées de catalogue référencées ne peuvent pas être
supprimées.
