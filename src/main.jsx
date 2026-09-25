import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {Search,SlidersHorizontal,Play,Heart,Plus,Star,Compass,Languages,Clapperboard,X,Film} from "lucide-react";
import "./styles.css";

// Put your TMDB API Read Access Token in .env:
// VITE_TMDB_TOKEN=your_token_here
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN || "";
const IMG="https://image.tmdb.org/t/p/w500";

const languages=[
  ["All","all"],["Tamil","ta"],["Telugu","te"],["Hindi","hi"],["Malayalam","ml"],["Kannada","kn"],
  ["English","en"],["Korean","ko"],["Japanese","ja"],["Chinese","zh"],["Spanish","es"],["French","fr"],["Other","other"]
];

const genres=["All","Action","Adventure","Animation","Comedy","Crime","Drama","Fantasy","Horror","Mystery","Romance","Sci-Fi","Thriller"];

const genreIds={
  Action:28,Adventure:12,Animation:16,Comedy:35,Crime:80,Drama:18,Fantasy:14,
  Horror:27,Mystery:9648,Romance:10749,"Sci-Fi":878,Thriller:53
};

const languageNames=Object.fromEntries(languages.slice(1).map(([name,code])=>[code,name]));

const demo=[
 {id:1,title:"Jailer",year:"2023",lang:"Tamil",genre:"Action",rating:"7.1",img:"https://image.tmdb.org/t/p/w500/7CNCv4g0Yp8q9l1rQq0KfH8oH8.jpg",tag:"Mass"},
 {id:2,title:"RRR",year:"2022",lang:"Telugu",genre:"Action",rating:"7.8",img:"https://image.tmdb.org/t/p/w500/soV3f8e8Yx7m8r0M3d3Q5z5r2.jpg",tag:"Epic"},
 {id:3,title:"Manjummel Boys",year:"2024",lang:"Malayalam",genre:"Drama",rating:"8.0",img:"https://image.tmdb.org/t/p/w500/8Q0qQf0Q1J3e4M8G7H5K2V4D3.jpg",tag:"Trending"},
 {id:4,title:"12th Fail",year:"2023",lang:"Hindi",genre:"Drama",rating:"8.2",img:"https://image.tmdb.org/t/p/w500/5f9d3Qyq2k1X7m8H4p5V6c2B1.jpg",tag:"Must Watch"},
 {id:5,title:"The Dark Knight",year:"2008",lang:"English",genre:"Action",rating:"9.0",img:"https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",tag:"Classic"},
 {id:6,title:"Parasite",year:"2019",lang:"Korean",genre:"Thriller",rating:"8.5",img:"https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",tag:"Awarded"},
 {id:7,title:"Your Name",year:"2016",lang:"Japanese",genre:"Animation",rating:"8.4",img:"https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg",tag:"Anime"},
 {id:8,title:"Dangal",year:"2016",lang:"Hindi",genre:"Drama",rating:"8.3",img:"https://image.tmdb.org/t/p/w500/w2c2s4o8q3J9p2v7L4X1M6N8.jpg",tag:"Popular"},
 {id:9,title:"Kantara",year:"2022",lang:"Kannada",genre:"Mystery",rating:"7.8",img:"https://image.tmdb.org/t/p/w500/x9m6b4J8f3s7D2q5T1N0L9K8.jpg",tag:"Mystic"},
 {id:10,title:"Premalu",year:"2024",lang:"Malayalam",genre:"Romance",rating:"7.7",img:"https://image.tmdb.org/t/p/w500/9X2x4a8s6d3f1g7h5j0k2l4m.jpg",tag:"Feel Good"},
 {id:11,title:"Spider-Man: Across the Spider-Verse",year:"2023",lang:"English",genre:"Animation",rating:"8.6",img:"https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",tag:"Visual"},
 {id:12,title:"Train to Busan",year:"2016",lang:"Korean",genre:"Horror",rating:"7.6",img:"https://image.tmdb.org/t/p/w500/vNVFt6dtcqnI7hqa6LFBUibuFiw.jpg",tag:"Cult"}
];

function getGenreName(ids=[]){
  const entry=Object.entries(genreIds).find(([,id])=>ids.includes(id));
  return entry?.[0] || "Movie";
}

function getLanguageName(code){
  return languageNames[code] || code || "Other";
}

function mapTmdbMovie(x){
  return {
    id:x.id,
    title:x.title || x.original_title || "Untitled",
    year:x.release_date?.slice(0,4) || "",
    lang:getLanguageName(x.original_language),
    genre:getGenreName(x.genre_ids),
    genreIds:x.genre_ids || [],
    rating:x.vote_average != null ? x.vote_average.toFixed(1) : "—",
    img:x.poster_path ? IMG+x.poster_path : "",
    tag:"Discover"
  };
}

function App(){
 const [q,setQ]=useState("");
 const [lang,setLang]=useState("All");
 const [genre,setGenre]=useState("All");
 const [movies,setMovies]=useState(demo);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [selected,setSelected]=useState(null);
 const [watchlist,setWatchlist]=useState([]);
 const [hero,setHero]=useState(0);

 useEffect(()=>{
   const t=setInterval(()=>setHero(x=>(x+1)%demo.length),5000);
   return()=>clearInterval(t)
 },[]);

 const filtered=useMemo(()=>{
   const search=q.trim().toLowerCase();
   return movies.filter(m=>
     (lang==="All"||m.lang===lang) &&
     (genre==="All"||m.genre===genre) &&
     (!search||m.title.toLowerCase().includes(search))
   )
 },[movies,lang,genre,q]);

 async function tmdb(){
   if(!TMDB_TOKEN){
     setError("TMDB token missing. Add VITE_TMDB_TOKEN to .env");
     setMovies(demo);
     return;
   }

   setLoading(true);
   setError("");

   try{
     const params=new URLSearchParams({
       include_adult:"false",
       include_video:"false",
       language:"en-US",
       page:"1",
       sort_by:"popularity.desc"
     });

    if(genre!=="All") {
  params.set("with_genres", String(genreIds[genre]));
}

if(lang!=="All" && lang!=="Other") {
  const langCode = languages.find(([name]) => name === lang)?.[1];

  if(langCode) {
    params.set("with_original_language", langCode);
  }
}

     const url=`https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
     const r=await fetch(url,{
       headers:{
         Authorization:`Bearer ${TMDB_TOKEN}`,
         accept:"application/json"
       }
     });

     if(!r.ok){
       const body=await r.text();
       throw new Error(`TMDB ${r.status}: ${body}`);
     }

     const d=await r.json();
     setMovies((d.results||[]).map(mapTmdbMovie));
  } catch(e){
  console.error(e);
  setError("TMDB connection failed. Showing demo movies.");
  setMovies(demo);
}finally{
     setLoading(false);
   }
 }

 async function searchMovies(){
   if(!TMDB_TOKEN){
     return;
   }
   const term=q.trim();
   if(!term){
     tmdb();
     return;
   }

   setLoading(true);
   setError("");
   try{
     const params=new URLSearchParams({
       query:term,
       include_adult:"false",
       language:"en-US",
       page:"1"
     });
     const r=await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`,{
       headers:{Authorization:`Bearer ${TMDB_TOKEN}`,accept:"application/json"}
     });
     if(!r.ok) throw new Error(`TMDB ${r.status}`);
     const d=await r.json();

     let results=(d.results||[]).map(mapTmdbMovie);
     if(lang!=="All") results=results.filter(m=>m.lang===lang);
     if(genre!=="All") results=results.filter(m=>m.genre===genre);
     setMovies(results);
   }catch(e){
     console.error(e);
     setError("Movie search failed. Check your TMDB token.");
     setMovies([]);
   }finally{
     setLoading(false);
   }
 }

 useEffect(() => {
  const timer = setTimeout(() => {
    if (q.trim()) {
      searchMovies();
    } else {
      tmdb();
    }
  }, 400);

  return () => clearTimeout(timer);
}, [q, lang, genre]);

 const heroMovie=demo[hero];
 const toggleWatch=(id)=>setWatchlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);

 return <div className="app">
  <div className="grain"/>
  <header className="nav">
   <div className="brand"><span className="brand-mark">M</span><span>MOVIE <b>MAFIA</b></span></div>
   <nav><a className="active">Discover</a><a>Movies</a><a>Collections</a><a>Watchlist <small>{watchlist.length}</small></a></nav>
   <div className="nav-actions">
    <div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search movies..."/></div>
    <button
  className="icon-btn"
  onClick={() =>
    document.getElementById("discover")?.scrollIntoView({
      behavior: "smooth"
    })
  }
  title="Open Filters"
>
  <SlidersHorizontal size={19}/>
</button>
   </div>
  </header>

  <main>
   <section className="hero">
    <div className="hero-bg" style={{backgroundImage:`url(${heroMovie.img})`}}/>
    <div className="hero-overlay"/>
    <div className="hero-content">
      <div className="eyebrow"><span/> YOUR NEXT OBSESSION</div>
      <h1>Find movies<br/><em>that hit different.</em></h1>
      <p>One place. Every language. Every genre. Discover films you'll want to talk about tomorrow.</p>
      <div className="hero-buttons">
        <button className="primary" onClick={()=>document.getElementById("discover").scrollIntoView({behavior:"smooth"})}><Compass size={18}/> Explore Movies</button>
        <button className="ghost" onClick={()=>setSelected(heroMovie)}><Play size={17}/> Quick View</button>
      </div>
    </div>
    <div className="hero-card"><span className="vertical">FEATURED TONIGHT</span><img src={heroMovie.img}/><div><b>{heroMovie.title}</b><small>{heroMovie.year} • {heroMovie.genre} • ★ {heroMovie.rating}</small></div></div>
    <div className="hero-dots">{demo.slice(0,6).map((_,i)=><button key={i} className={i===hero%6?"dot on":"dot"} onClick={()=>setHero(i)}/>)}</div>
   </section>

   <section className="discover" id="discover">
    <div className="section-head"><div><span className="kicker">THE MAFIA VAULT</span><h2>Pick your <span>poison.</span></h2></div><p>Tell us what you're in the mood for.<br/>We'll handle the rabbit hole.</p></div>

    <div className="filters">
      <div className="filter-title"><Languages size={17}/> LANGUAGE</div>
      <div className="chips">{languages.map(([name])=><button key={name} className={lang===name?"chip active":"chip"} onClick={()=>setLang(name)}>{name}</button>)}</div>
    </div>

    <div className="filters genre-filter">
      <div className="filter-title"><Clapperboard size={17}/> GENRE</div>
      <div className="chips">{genres.map(name=><button key={name} className={genre===name?"chip active":"chip"} onClick={()=>setGenre(name)}>{name}</button>)}</div>
    </div>

    <div className="results-head">
      <div><span className="kicker">CURATED FOR YOU</span><h3>{lang==="All"?"All Languages":lang} <span>·</span> {genre}</h3></div>
      <span className="count">{loading?"Loading…":`${filtered.length} titles`}</span>
    </div>

    {error&&<div className="empty" style={{padding:"20px",marginBottom:"20px"}}>{error}</div>}

    <div className="grid">{filtered.map(m=><MovieCard key={m.id} m={m} liked={watchlist.includes(m.id)} onLike={()=>toggleWatch(m.id)} onOpen={()=>setSelected(m)}/>)}</div>
    {!loading&&!filtered.length&&!error&&<div className="empty">No titles found. Try another language, genre, or search.</div>}
   </section>
  </main>

  <footer><div className="brand"><span className="brand-mark">M</span><span>MOVIE <b>MAFIA</b></span></div><span>© 2026 Movie Mafia • Discover responsibly.</span></footer>

  {selected&&<div className="modal" onClick={()=>setSelected(null)}>
    <div className="modal-box" onClick={e=>e.stopPropagation()}>
      <button className="close" onClick={()=>setSelected(null)}><X/></button>
      {selected.img?<img src={selected.img} onError={e=>{e.currentTarget.style.display="none"}}/>:<div className="poster-fallback"><Film size={36}/></div>}
      <div className="modal-info"><span className="pill">{selected.tag||"DISCOVER"}</span><h2>{selected.title}</h2><p>{selected.year} • {selected.lang} • {selected.genre} • ★ {selected.rating}</p><p className="muted">Explore this title and discover more films from the same language and genre.</p><button className="primary" onClick={()=>toggleWatch(selected.id)}>{watchlist.includes(selected.id)?<Heart fill="currentColor"/>:<Plus/>}{watchlist.includes(selected.id)?" In Watchlist":" Add to Watchlist"}</button></div>
    </div>
  </div>}
 </div>
}

function MovieCard({m,liked,onLike,onOpen}){
 return <article className="movie-card" onClick={onOpen}>
   <div className="poster">
     {m.img?<img src={m.img} onError={e=>{e.currentTarget.style.display="none"}}/>:<div className="poster-fallback"><Film size={36}/></div>}
     <span className="tag">{m.tag||"MOVIE"}</span>
     <button className="heart" onClick={e=>{e.stopPropagation();onLike()}}>{liked?<Heart fill="currentColor" size={17}/>:<Heart size={17}/>}</button>
     <div className="play"><Play fill="currentColor" size={18}/></div>
   </div>
   <div className="movie-meta"><div><h4>{m.title}</h4><p>{m.year} <span/> {m.lang} <span/> {m.genre}</p></div><b className="rating"><Star fill="currentColor" size={13}/> {m.rating||"—"}</b></div>
 </article>
}

createRoot(document.getElementById("root")).render(<App/>);
