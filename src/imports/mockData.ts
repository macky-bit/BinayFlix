import type { Show, CatalogRow, TMDBCatalogData } from "./types";

// Placeholder images from picsum.photos — seeded so they stay consistent.
// Poster ratio 2:3  → w=342 h=513
// Hero/backdrop     → w=1280 h=720
function poster(seed: number) {
  return `https://picsum.photos/seed/sf-poster-${seed}/342/513`;
}
function hero(seed: number) {
  return `https://picsum.photos/seed/sf-hero-${seed}/1280/720`;
}

const MOCK_SHOWS: Show[] = [
  { id: 1,  title: "Neon Horizon",        year: "2024", rating: "PG-13", duration: "2h 08m", genres: ["Sci-Fi","Action"],    image: poster(1),  hero: "https://images.unsplash.com/photo-1660228652863-891f27cbe45c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1280&q=80",  description: "A lone engineer discovers a signal from the edge of the solar system and risks everything to answer it.", match: 96, mediaType: "movie" },
  { id: 2,  title: "The Last Signal",     year: "2023", rating: "TV-MA", duration: "3 seasons", genres: ["Drama","Mystery"], image: poster(2),  hero: hero(2),  description: "In a near-future city, a detective unravels a conspiracy buried inside the city's own AI infrastructure.", match: 91, mediaType: "tv" },
  { id: 3,  title: "Crimson Tide",        year: "2024", rating: "R",     duration: "1h 54m", genres: ["Thriller","Crime"],   image: poster(3),  hero: hero(3),  description: "A federal prosecutor goes off the grid after discovering her case files have been compromised from within.", match: 88, mediaType: "movie" },
  { id: 4,  title: "Echoes of Tomorrow",  year: "2022", rating: "TV-14", duration: "2 seasons", genres: ["Sci-Fi","Drama"],  image: poster(4),  hero: hero(4),  description: "Six strangers wake up in the same city with no memory — and slowly realize they share more than confusion.", match: 83, mediaType: "tv" },
  { id: 5,  title: "Feral",               year: "2024", rating: "R",     duration: "1h 42m", genres: ["Horror","Thriller"], image: poster(5),  hero: hero(5),  description: "Deep in a national park, a wildlife biologist uncovers something the forest was never meant to hide.", match: 79, mediaType: "movie" },
  { id: 6,  title: "Midnight Archive",    year: "2023", rating: "TV-MA", duration: "1 season",  genres: ["Drama","Mystery"], image: poster(6),  hero: hero(6),  description: "An archivist stumbles upon classified footage that rewrites thirty years of history.", match: 92, mediaType: "tv" },
  { id: 7,  title: "Glass Kingdom",       year: "2022", rating: "PG",    duration: "1h 47m", genres: ["Adventure","Family"],image: poster(7),  hero: hero(7),  description: "A young inventor builds a machine that lets her enter every book she has ever read.", match: 85, mediaType: "movie" },
  { id: 8,  title: "After the Signal",    year: "2023", rating: "TV-PG", duration: "2 seasons", genres: ["Drama","Family"],  image: poster(8),  hero: hero(8),  description: "A small coastal town fights to keep its identity when a tech giant buys the shoreline.", match: 77, mediaType: "tv" },
  { id: 9,  title: "Northbound",          year: "2024", rating: "PG-13", duration: "2h 02m", genres: ["Drama","Adventure"],image: poster(9),  hero: hero(9),  description: "Two estranged brothers drive across Alaska to fulfil their father's last wish before winter closes the roads.", match: 82, mediaType: "movie" },
  { id: 10, title: "Iron Frequency",      year: "2023", rating: "TV-MA", duration: "1 season",  genres: ["Sci-Fi","Action"], image: poster(10), hero: hero(10), description: "A rogue satellite starts broadcasting instructions that only a small group of people can decode.", match: 89, mediaType: "tv" },
  { id: 11, title: "Silent Current",      year: "2024", rating: "TV-14", duration: "3 seasons", genres: ["Drama","Thriller"],image: poster(11), hero: hero(11), description: "An underwater archaeologist discovers an ancient map that puts her directly in the crosshairs of a private military force.", match: 86, mediaType: "tv" },
  { id: 12, title: "The Pale Road",       year: "2022", rating: "R",     duration: "2h 17m", genres: ["Western","Drama"],  image: poster(12), hero: hero(12), description: "A grieving marshal pursues the outlaw who burned her town — across a landscape that doesn't want to be found.", match: 90, mediaType: "movie" },
  { id: 13, title: "Orbit",               year: "2024", rating: "PG",    duration: "1h 58m", genres: ["Sci-Fi","Adventure"],image: poster(13), hero: hero(13), description: "A 12-year-old stowaway aboard a tourist space station helps the crew survive an unexpected system failure.", match: 81, mediaType: "movie" },
  { id: 14, title: "Velvet Underground",  year: "2023", rating: "TV-MA", duration: "2 seasons", genres: ["Crime","Drama"],  image: poster(14), hero: hero(14), description: "A jazz singer becomes the unexpected mole inside the city's most dangerous crime syndicate.", match: 87, mediaType: "tv" },
  { id: 15, title: "The Last Horizon",    year: "2024", rating: "PG-13", duration: "2h 14m", genres: ["Sci-Fi","Drama"],   image: poster(15), hero: hero(15), description: "Earth's final generation prepares to leave the planet — but not everyone agrees the mission should succeed.", match: 94, mediaType: "movie" },
  { id: 16, title: "Cascade",             year: "2023", rating: "TV-14", duration: "1 season",  genres: ["Thriller","Drama"],image: poster(16), hero: hero(16), description: "A hydrologist discovers the city's water supply has been quietly poisoned — and the coverup goes to the top.", match: 78, mediaType: "tv" },
  { id: 17, title: "Nomad",               year: "2024", rating: "PG-13", duration: "1h 51m", genres: ["Action","Adventure"],image: poster(17), hero: hero(17), description: "A freelance courier in a fragmented future society becomes the unlikely carrier of a message that could reunite the world.", match: 84, mediaType: "movie" },
  { id: 18, title: "Smoke & Steel",       year: "2022", rating: "TV-MA", duration: "4 seasons", genres: ["Action","Drama"], image: poster(18), hero: hero(18), description: "A retired weapon-smith is pulled back into the underworld when her daughter is taken as ransom.", match: 93, mediaType: "tv" },
  { id: 19, title: "The August Theory",   year: "2024", rating: "PG-13", duration: "2h 06m", genres: ["Thriller","Mystery"],image: poster(19), hero: hero(19), description: "A mathematician proves that a historical event was deliberately engineered — and must survive long enough to tell anyone.", match: 88, mediaType: "movie" },
  { id: 20, title: "Ember",               year: "2023", rating: "TV-14", duration: "2 seasons", genres: ["Drama","Sci-Fi"], image: poster(20), hero: hero(20), description: "In a world where emotions are visible as colour, a detective who has lost all feeling is assigned to track a serial arsonist.", match: 95, mediaType: "tv" },
];

function makeRows(ids: number[], title: string, opts: { top10?: boolean; exploreAll?: boolean } = {}): CatalogRow {
  return {
    title,
    shows: ids.map((id) => MOCK_SHOWS[id - 1]).filter(Boolean),
    top10: opts.top10,
    exploreAll: opts.exploreAll,
  };
}

export const MOCK_CATALOGS: Record<string, TMDBCatalogData> = {
  home: {
    featured: MOCK_SHOWS[0],
    rows: [
      makeRows([1,3,5,7,9,11,13,15,17,19,2,4], "Trending Now"),
      makeRows([2,4,6,8,10,12,14,16,18,20,1,3], "New Movies", { exploreAll: true }),
      makeRows([2,4,6,10,11,14,16,18,20,8,12,3], "Popular TV Shows", { exploreAll: true }),
      makeRows([1,3,5,7,9,11,13,15,17,19,2,4], "Top 10 Movies Today", { top10: true }),
      makeRows([15,19,1,3,7,9,13,17,5,11,2,6], "Critically Acclaimed"),
    ],
    loading: false,
    error: null,
  },
  movies: {
    featured: MOCK_SHOWS[2],
    rows: [
      makeRows([1,3,5,7,9,13,15,17,19,12,2,4], "Trending Movies"),
      makeRows([1,5,9,13,3,7,15,17,19,12,6,10], "Now Playing", { exploreAll: true }),
      makeRows([1,3,5,7,9,11,13,15,17,19,2,4], "Top 10 Movies Today", { top10: true }),
      makeRows([3,5,17,19,1,9,13,15,7,12,6,2], "Action & Thriller"),
      makeRows([4,9,12,15,19,1,3,7,11,16,2,5], "Drama"),
      makeRows([1,4,10,13,15,20,3,5,7,9,11,17], "Sci-Fi"),
      makeRows([5,3,12,19,1,7,9,15,17,4,6,8], "Horror & Thriller"),
    ],
    loading: false,
    error: null,
  },
  tvShows: {
    featured: MOCK_SHOWS[1],
    rows: [
      makeRows([2,4,6,8,10,11,14,16,18,20,1,3], "Trending TV Shows"),
      makeRows([2,6,10,14,18,4,8,12,16,20,1,5], "On the Air", { exploreAll: true }),
      makeRows([2,4,6,8,10,11,14,16,18,20,1,3], "Top 10 TV Shows Today", { top10: true }),
      makeRows([10,18,2,4,8,14,20,6,11,16,3,7], "Action & Adventure"),
      makeRows([4,6,8,11,16,20,2,10,14,18,1,3], "Drama"),
      makeRows([2,4,10,11,20,6,8,14,16,18,1,5], "Sci-Fi & Fantasy"),
      makeRows([6,14,16,2,4,8,10,18,20,11,3,5], "Mystery & Crime"),
    ],
    loading: false,
    error: null,
  },
  newAndPopular: {
    featured: MOCK_SHOWS[19],
    rows: [
      makeRows([20,1,3,5,7,9,11,13,15,17,19,2], "Trending Today"),
      makeRows([1,2,3,4,5,6,7,8,9,10,11,12], "Popular This Week"),
      makeRows([1,3,5,7,9,13,15,17,19,12,2,4], "Upcoming Movies", { exploreAll: true }),
      makeRows([2,4,6,8,10,11,14,16,18,20,1,3], "TV Shows Airing Now", { exploreAll: true }),
      makeRows([15,13,9,17,1,19,7,3,5,12,6,2], "Popular Movies"),
      makeRows([20,18,14,10,2,6,4,8,16,11,1,3], "Popular TV Shows"),
    ],
    loading: false,
    error: null,
  },
};
