import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  Heart,
  Play,
  X,
  Star,
  ChevronDown,
  Loader2,
  Plus,
  Clapperboard,
} from "lucide-react";
import "./styles.css";

/* =========================================================
   TMDB CONFIG
========================================================= */

const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN || "";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

/* =========================================================
   LANGUAGE LIST
========================================================= */

const LANGUAGES = [
  { name: "All Languages", code: "all" },
  { name: "Tamil", code: "ta" },
  { name: "Telugu", code: "te" },
  { name: "Hindi", code: "hi" },
  { name: "Malayalam", code: "ml" },
  { name: "Kannada", code: "kn" },
  { name: "English", code: "en" },
  { name: "Korean", code: "ko" },
  { name: "Japanese", code: "ja" },
  { name: "Chinese", code: "zh" },
  { name: "Spanish", code: "es" },
  { name: "French", code: "fr" },
  { name: "Other", code: "other" },
];

/* =========================================================
   GENRE LIST
========================================================= */

const GENRES = [
  { name: "All Genres", id: "all" },
  { name: "Action", id: 28 },
  { name: "Adventure", id: 12 },
  { name: "Animation", id: 16 },
  { name: "Comedy", id: 35 },
  { name: "Crime", id: 80 },
  { name: "Drama", id: 18 },
  { name: "Fantasy", id: 14 },
  { name: "Horror", id: 27 },
  { name: "Mystery", id: 9648 },
  { name: "Romance", id: 10749 },
  { name: "Sci-Fi", id: 878 },
  { name: "Thriller", id: 53 },
];

/* =========================================================
   LANGUAGE NAME HELPER
========================================================= */

const languageName = (code) => {
  const found = LANGUAGES.find((item) => item.code === code);

  if (found && found.code !== "all" && found.code !== "other") {
    return found.name;
  }

  return code ? code.toUpperCase() : "Unknown";
};

/* =========================================================
   GENRE NAME HELPER
========================================================= */

const genreName = (id) => {
  const found = GENRES.find((item) => String(item.id) === String(id));

  return found ? found.name : "Movie";
};

/* =========================================================
   DEMO MOVIES
   Used only when TMDB is unavailable.
========================================================= */

const DEMO_MOVIES = [
  {
    id: "demo-1",
    title: "Retro",
    year: "2025",
    lang: "Tamil",
    genre: "Drama",
    genreIds: [],
    rating: 8.1,
    img: "",
    tag: "Trending",
  },
  {
    id: "demo-2",
    title: "Dragon",
    year: "2025",
    lang: "Tamil",
    genre: "Comedy",
    genreIds: [],
    rating: 8.0,
    img: "",
    tag: "Popular",
  },
  {
    id: "demo-3",
    title: "Interstellar",
    year: "2014",
    lang: "English",
    genre: "Sci-Fi",
    genreIds: [878],
    rating: 8.7,
    img: "",
    tag: "Classic",
  },
  {
    id: "demo-4",
    title: "Inception",
    year: "2010",
    lang: "English",
    genre: "Sci-Fi",
    genreIds: [878],
    rating: 8.8,
    img: "",
    tag: "Top Rated",
  },
];

/* =========================================================
   TMDB MOVIE MAPPER
========================================================= */

function mapTmdbMovie(movie) {
  const genreIds = movie.genre_ids || [];

  return {
    id: movie.id,
    title: movie.title || movie.original_title || "Untitled Movie",
    year: movie.release_date
      ? movie.release_date.substring(0, 4)
      : "N/A",
    lang: languageName(movie.original_language),
    languageCode: movie.original_language || "",
    genre:
      genreIds.length > 0
        ? genreName(genreIds[0])
        : "Movie",
    genreIds,
    rating: Number(movie.vote_average || 0).toFixed(1),
    img: movie.poster_path
      ? `${TMDB_IMAGE_URL}${movie.poster_path}`
      : "",
    backdrop: movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : "",
    overview:
      movie.overview ||
      "No movie description is available.",
    tag:
      Number(movie.vote_average || 0) >= 8
        ? "Top Rated"
        : Number(movie.popularity || 0) > 100
        ? "Trending"
        : "Movie",
    popularity: movie.popularity || 0,
  };
}

/* =========================================================
   API HELPER
========================================================= */

async function tmdbFetch(endpoint, params = {}) {
  if (!TMDB_TOKEN) {
    throw new Error(
      "TMDB token not found. Please check your .env file."
    );
  }

  const searchParams = new URLSearchParams(params);

  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    let message = `TMDB API Error: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.status_message) {
        message = errorData.status_message;
      }
    } catch {
      // Ignore JSON parse error
    }

    throw new Error(message);
  }

  return response.json();
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [movies, setMovies] = useState(DEMO_MOVIES);

  const [language, setLanguage] = useState("all");
  const [genre, setGenre] = useState("all");
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedMovie, setSelectedMovie] = useState(null);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("movie-mafia-watchlist");

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [trailerKey, setTrailerKey] = useState("");
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [trailerTitle, setTrailerTitle] = useState("");

  /* =======================================================
     SAVE WATCHLIST
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "movie-mafia-watchlist",
      JSON.stringify(watchlist)
    );
  }, [watchlist]);

  /* =======================================================
     WATCHLIST TOGGLE
  ======================================================= */

  const toggleWatchlist = (movie) => {
    setWatchlist((current) => {
      const exists = current.some(
        (item) => String(item.id) === String(movie.id)
      );

      if (exists) {
        return current.filter(
          (item) => String(item.id) !== String(movie.id)
        );
      }

      return [...current, movie];
    });
  };

  const isInWatchlist = (movie) => {
    return watchlist.some(
      (item) => String(item.id) === String(movie.id)
    );
  };

  /* =======================================================
     DISCOVER MOVIES
  ======================================================= */

  const fetchDiscoverMovies = async (
    targetPage = 1,
    append = false
  ) => {
    if (!TMDB_TOKEN) {
      setError(
        "TMDB token is missing. Showing demo movies."
      );

      if (!append) {
        setMovies(DEMO_MOVIES);
      }

      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {
        include_adult: "false",
        include_video: "true",
        language: "en-US",
        page: String(targetPage),
        sort_by: "popularity.desc",
      };

      /* Genre filter */

      if (genre !== "all") {
        params.with_genres = String(genre);
      }

      /* Language filter */

      if (language !== "all" && language !== "other") {
        params.with_original_language = language;
      }

      /* Other languages */

      if (language === "other") {
        params.with_original_language = "";
      }

      const data = await tmdbFetch(
        "/discover/movie",
        params
      );

      const newMovies = (data.results || []).map(
        mapTmdbMovie
      );

      if (append) {
        setMovies((current) => {
          const existingIds = new Set(
            current.map((movie) => String(movie.id))
          );

          const uniqueNewMovies = newMovies.filter(
            (movie) =>
              !existingIds.has(String(movie.id))
          );

          return [...current, ...uniqueNewMovies];
        });
      } else {
        setMovies(newMovies);
      }

      setPage(targetPage);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load movies from TMDB."
      );

      if (!append) {
        setMovies(DEMO_MOVIES);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  /* =======================================================
     SEARCH MOVIES
  ======================================================= */

  const searchMovies = async (searchText) => {
    if (!TMDB_TOKEN) {
      setMovies(DEMO_MOVIES);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        query: searchText,
        include_adult: "false",
        language: "en-US",
        page: "1",
      };

      if (
        language !== "all" &&
        language !== "other"
      ) {
        params.language = "en-US";
      }

      const data = await tmdbFetch(
        "/search/movie",
        params
      );

      let results = (data.results || []).map(
        mapTmdbMovie
      );

      /* Client-side language filter */

      if (
        language !== "all" &&
        language !== "other"
      ) {
        results = results.filter(
          (movie) =>
            movie.languageCode === language
        );
      }

      /* Client-side genre filter */

      if (genre !== "all") {
        results = results.filter((movie) =>
          movie.genreIds?.includes(Number(genre))
        );
      }

      setMovies(results);
      setPage(1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to search movies."
      );

      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FILTER / SEARCH EFFECT
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchMovies(query.trim());
      } else {
        fetchDiscoverMovies(1, false);
      }
    }, 350);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, language, genre]);

  /* =======================================================
     LOAD MORE
  ======================================================= */

  const loadMoreMovies = () => {
    if (
      loadingMore ||
      loading ||
      page >= totalPages
    ) {
      return;
    }

    if (query.trim()) {
      searchMovies(query.trim());
    } else {
      fetchDiscoverMovies(page + 1, true);
    }
  };

  /* =======================================================
     GET TRAILER
  ======================================================= */

  const openTrailer = async (movie) => {
    if (!movie?.id) return;

    /*
      Demo movie doesn't have TMDB ID.
    */

    if (
      typeof movie.id === "string" &&
      movie.id.startsWith("demo-")
    ) {
      alert(
        "Trailer is available for TMDB movies. Please use a movie loaded from TMDB."
      );

      return;
    }

    try {
      setTrailerLoading(true);
      setTrailerTitle(movie.title);
      setTrailerKey("");

      const data = await tmdbFetch(
        `/movie/${movie.id}/videos`,
        {
          language: "en-US",
        }
      );

      const videos = data.results || [];

      /*
        Priority:
        1. Official Trailer
        2. Trailer
        3. Official Teaser
        4. Teaser
        5. Any YouTube video
      */

      const youtubeVideos = videos.filter(
        (video) =>
          video.site === "YouTube" &&
          video.key
      );

      const officialTrailer =
        youtubeVideos.find(
          (video) =>
            video.type === "Trailer" &&
            video.official === true
        );

      const normalTrailer =
        youtubeVideos.find(
          (video) =>
            video.type === "Trailer"
        );

      const officialTeaser =
        youtubeVideos.find(
          (video) =>
            video.type === "Teaser" &&
            video.official === true
        );

      const normalTeaser =
        youtubeVideos.find(
          (video) =>
            video.type === "Teaser"
        );

      const selectedVideo =
        officialTrailer ||
        normalTrailer ||
        officialTeaser ||
        normalTeaser ||
        youtubeVideos[0];

      if (selectedVideo) {
        setTrailerKey(selectedVideo.key);
      } else {
        alert(
          "Trailer is not available for this movie."
        );
      }
    } catch (err) {
      console.error(err);

      alert(
        "Unable to load trailer. Please try again."
      );
    } finally {
      setTrailerLoading(false);
    }
  };

  /* =======================================================
     CLOSE TRAILER
  ======================================================= */

  const closeTrailer = () => {
    setTrailerKey("");
    setTrailerTitle("");
  };

  /* =======================================================
     HERO MOVIES
  ======================================================= */

  const heroMovies = useMemo(() => {
    if (movies.length > 0) {
      return movies.slice(0, 3);
    }

    return DEMO_MOVIES;
  }, [movies]);

  const heroMovie = heroMovies[0];

  /* =======================================================
     RETURN UI
  ======================================================= */

  return (
    <div className="app">
      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="navbar">
        <div className="brand">
          <div className="brand-mark">
            M
          </div>

          <div>
            <div className="brand-name">
              MOVIE MAFIA
            </div>

            <div className="brand-sub">
              DISCOVER · WATCH · REPEAT
            </div>
          </div>
        </div>

        <div className="nav-watchlist">
          <Heart size={17} />

          <span>
            {watchlist.length}
          </span>
        </div>
      </header>

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR PERSONAL MOVIE UNIVERSE
          </div>

          <h1>
            FIND YOUR NEXT
            <span> OBSESSION.</span>
          </h1>

          <p>
            Discover movies from around the world.
            Search by language, genre, rating and
            popularity — all in one place.
          </p>

          {/* SEARCH */}

          <div className="search-box">
            <Search size={20} />

            <input
              type="text"
              placeholder="Search for a movie..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />

            {query && (
              <button
                className="clear-search"
                onClick={() => setQuery("")}
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* FILTERS */}

          <div className="filters">
            <div className="select-wrap">
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
              >
                {LANGUAGES.map((item) => (
                  <option
                    key={item.code}
                    value={item.code}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />
            </div>

            <div className="select-wrap">
              <select
                value={genre}
                onChange={(e) =>
                  setGenre(e.target.value)
                }
              >
                {GENRES.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* HERO POSTER */}

        <div className="hero-poster-area">
          {heroMovie?.img ? (
            <img
              src={heroMovie.img}
              alt={heroMovie.title}
              className="hero-poster"
            />
          ) : (
            <div className="hero-placeholder">
              <Clapperboard size={50} />
            </div>
          )}

          <div className="hero-floating-card">
            <div className="hero-rating">
              <Star
                size={15}
                fill="currentColor"
              />

              {heroMovie?.rating || "8.0"}
            </div>

            <strong>
              {heroMovie?.title ||
                "Movie Mafia"}
            </strong>

            <span>
              {heroMovie?.year || "2025"} ·{" "}
              {heroMovie?.lang || "Worldwide"}
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* ===================================================
          MOVIE SECTION
      =================================================== */}

      <main className="movie-section">
        <div className="section-header">
          <div>
            <div className="section-kicker">
              EXPLORE
            </div>

            <h2>
              {query
                ? `Results for "${query}"`
                : "Trending Movies"}
            </h2>
          </div>

          <div className="movie-count">
            {movies.length} movies
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="loading-state">
            <Loader2
              size={34}
              className="spin"
            />

            <p>
              Discovering movies...
            </p>
          </div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <Clapperboard size={40} />

            <h3>
              No movies found
            </h3>

            <p>
              Try another movie name,
              language or genre.
            </p>
          </div>
        ) : (
          <>
            {/* MOVIE GRID */}

            <div className="grid">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  inWatchlist={isInWatchlist(
                    movie
                  )}
                  onWatchlist={() =>
                    toggleWatchlist(movie)
                  }
                  onOpen={() =>
                    setSelectedMovie(movie)
                  }
                  onTrailer={() =>
                    openTrailer(movie)
                  }
                />
              ))}
            </div>

            {/* LOAD MORE */}

            {!query && page < totalPages && (
              <div className="load-more-area">
                <button
                  className="load-more"
                  onClick={loadMoreMovies}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2
                        size={18}
                        className="spin"
                      />

                      Loading...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />

                      Load More Movies
                    </>
                  )}
                </button>

                <span>
                  Page {page} of{" "}
                  {Math.min(totalPages, 500)}
                </span>
              </div>
            )}
          </>
        )}
      </main>

      {/* ===================================================
          MOVIE DETAILS MODAL
      =================================================== */}

      {selectedMovie && (
        <div
          className="modal"
          onClick={() =>
            setSelectedMovie(null)
          }
        >
          <div
            className="modal-box"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setSelectedMovie(null)
              }
            >
              <X size={20} />
            </button>

            <div className="modal-content">
              <div className="modal-poster-wrap">
                {selectedMovie.img ? (
                  <img
                    src={selectedMovie.img}
                    alt={
                      selectedMovie.title
                    }
                    className="modal-poster"
                  />
                ) : (
                  <div className="modal-poster-placeholder">
                    <Clapperboard
                      size={40}
                    />
                  </div>
                )}
              </div>

              <div className="modal-info">
                <div className="modal-tag">
                  {selectedMovie.tag}
                </div>

                <h2>
                  {selectedMovie.title}
                </h2>

                <div className="modal-meta">
                  <span>
                    {selectedMovie.year}
                  </span>

                  <span>•</span>

                  <span>
                    {selectedMovie.lang}
                  </span>

                  <span>•</span>

                  <span>
                    {selectedMovie.genre}
                  </span>

                  <span>•</span>

                  <span className="rating">
                    <Star
                      size={14}
                      fill="currentColor"
                    />

                    {selectedMovie.rating}
                  </span>
                </div>

                <p className="overview">
                  {selectedMovie.overview ||
                    "No description available."}
                </p>

                <div className="modal-actions">
                  <button
                    className="primary-btn"
                    onClick={() =>
                      openTrailer(
                        selectedMovie
                      )
                    }
                  >
                    <Play
                      size={18}
                      fill="currentColor"
                    />

                    Watch Trailer
                  </button>

                  <button
                    className={
                      isInWatchlist(
                        selectedMovie
                      )
                        ? "secondary-btn active"
                        : "secondary-btn"
                    }
                    onClick={() =>
                      toggleWatchlist(
                        selectedMovie
                      )
                    }
                  >
                    <Heart
                      size={18}
                      fill={
                        isInWatchlist(
                          selectedMovie
                        )
                          ? "currentColor"
                          : "none"
                      }
                    />

                    {isInWatchlist(
                      selectedMovie
                    )
                      ? "In Watchlist"
                      : "Add to Watchlist"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          TRAILER MODAL
      =================================================== */}

      {(trailerLoading || trailerKey) && (
        <div
          className="trailer-modal"
          onClick={closeTrailer}
        >
          <div
            className="trailer-box"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="trailer-close"
              onClick={closeTrailer}
            >
              <X size={22} />
            </button>

            {trailerLoading ? (
              <div className="trailer-loading">
                <Loader2
                  size={42}
                  className="spin"
                />

                <p>
                  Loading trailer...
                </p>
              </div>
            ) : (
              <>
                <div className="trailer-header">
                  <div>
                    <span>
                      TRAILER
                    </span>

                    <h3>
                      {trailerTitle}
                    </h3>
                  </div>
                </div>

                <div className="video-wrapper">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                    title={`${trailerTitle} Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MOVIE CARD
========================================================= */

function MovieCard({
  movie,
  inWatchlist,
  onWatchlist,
  onOpen,
  onTrailer,
}) {
  return (
    <article className="movie-card">
      <div
        className="poster-wrap"
        onClick={onOpen}
      >
        {movie.img ? (
          <img
            src={movie.img}
            alt={movie.title}
            className="poster"
            loading="lazy"
          />
        ) : (
          <div className="poster-placeholder">
            <Clapperboard size={35} />
          </div>
        )}

        <div className="poster-overlay" />

        <div className="movie-tag">
          {movie.tag}
        </div>

        {/* WATCHLIST */}

        <button
          className={
            inWatchlist
              ? "heart-btn active"
              : "heart-btn"
          }
          onClick={(e) => {
            e.stopPropagation();
            onWatchlist();
          }}
          aria-label="Add to watchlist"
        >
          <Heart
            size={17}
            fill={
              inWatchlist
                ? "currentColor"
                : "none"
            }
          />
        </button>

        {/* TRAILER */}

        <button
          className="play"
          onClick={(e) => {
            e.stopPropagation();
            onTrailer();
          }}
          aria-label={`Play trailer for ${movie.title}`}
        >
          <Play
            size={20}
            fill="currentColor"
          />
        </button>
      </div>

      <div className="movie-info">
        <h3 title={movie.title}>
          {movie.title}
        </h3>

        <div className="movie-meta">
          <span>
            {movie.year}
          </span>

          <span className="dot">
            •
          </span>

          <span>
            {movie.lang}
          </span>

          <span className="rating">
            <Star
              size={12}
              fill="currentColor"
            />

            {movie.rating}
          </span>
        </div>

        <div className="movie-genre">
          {movie.genre}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   RENDER
========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);