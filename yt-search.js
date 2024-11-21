const youtubesearchapi = require("youtube-search-api");

searchTerm = 'https://www.youtube.com/watch?v=rn_YodiJO6k&pp=ygUfb3RoZXJzaWRlIHJlZCBob3QgY2hpbGkgcGVwcGVycw%3D%3D';

youtubesearchapi.GetListByKeyword(searchTerm,false,1).then((data) => {
    console.log(data);
}).catch((err) => {
    console.log(err);
});


