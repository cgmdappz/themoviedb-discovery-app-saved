import './MovieDashboardPage.css';

export default function MovieDashboardPage() {
  return (
    <main className="app-shell movie-dashboard">
      <header className="app-header">
        <p className="movie-dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <h2>
          Explorez les informations disponibles sur les films, leurs genres et
          leurs pays de production.
        </h2>
      </header>
      <section
        className="movie-dashboard-empty"
        aria-labelledby="movie-dashboard-empty-title"
      >
        <h2 id="movie-dashboard-empty-title">Aucun widget configuré</h2>
        <p>
          Les informations du tableau de bord apparaîtront ici lorsque des
          widgets seront disponibles.
        </p>
      </section>
    </main>
  );
}
