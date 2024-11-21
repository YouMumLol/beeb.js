const ytdl = require("@distube/ytdl-core");
// TypeScript: import ytdl from '@distube/ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from '@distube/ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('@distube/ytdl-core'); with neither of the above

// Download a video
// ytdl("http://www.youtube.com/watch?v=aqz-KE-bpKQ").pipe(require("fs").createWriteStream("video.mp4"));

// // Get video info
// ytdl.getBasicInfo("http://www.youtube.com/watch?v=aqz-KE-bpKQ").then(info => {
//   console.log(info.videoDetails.title);
// });

// Get video info with download formats
ytdl.getInfo("http://www.youtube.com/watch?v=aqz-KE-bpKQ").then(info => {
  console.log(info.videoDetails);
});