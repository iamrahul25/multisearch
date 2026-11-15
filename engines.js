// Search engines for the Search tab. `{q}` is replaced with the URL-encoded query.
// `url` is only used to look up the site's icon in Chrome's favicon cache.
const ENGINES = [
  { id: "google", name: "Google", url: "https://www.google.com/",
    web: "https://www.google.com/search?q={q}", images: "https://www.google.com/search?tbm=isch&q={q}" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/",
    web: "https://www.bing.com/search?q={q}", images: "https://www.bing.com/images/search?q={q}" },
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/",
    web: "https://duckduckgo.com/?q={q}", images: "https://duckduckgo.com/?q={q}&iax=images&ia=images" },
  { id: "brave", name: "Brave", url: "https://search.brave.com/",
    web: "https://search.brave.com/search?q={q}", images: "https://search.brave.com/images?q={q}" },
  { id: "yahoo", name: "Yahoo", url: "https://search.yahoo.com/",
    web: "https://search.yahoo.com/search?p={q}", images: "https://images.search.yahoo.com/search/images?p={q}" },
  { id: "ecosia", name: "Ecosia", url: "https://www.ecosia.org/",
    web: "https://www.ecosia.org/search?q={q}", images: "https://www.ecosia.org/images?q={q}" },
  { id: "startpage", name: "Startpage", url: "https://www.startpage.com/",
    web: "https://www.startpage.com/do/search?q={q}", images: "https://www.startpage.com/do/search?q={q}&cat=pics" },
  { id: "yandex", name: "Yandex", url: "https://yandex.com/",
    web: "https://yandex.com/search/?text={q}", images: "https://yandex.com/images/search?text={q}" }
];
