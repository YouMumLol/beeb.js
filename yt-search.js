const yts = require("yt-search");

searchTerm = 'skibidi';

const video =  yts(searchTerm)
.then((res) => {
    res.videos.forEach(element => {
        console.log(element.title);
        console.log(element.url);
    });
})