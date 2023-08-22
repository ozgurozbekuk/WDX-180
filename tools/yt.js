// cSpell:ignore clipboardy
const path          = require("node:path");
const https         = require('node:https'); // or 'https' for https:// URLs
const { parseArgs } = require("node:util");
const clipboardy    = require('clipboardy');

// https://pawelgrzybek.com/til-node-js-18-3-comes-with-command-line-arguments-parser/

const { warn, ok, info, convertToKebabCase, iso8601ToSeconds, formatDate } = require("./utils");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

// --get-video-info
// USAGE: node tools/yt.js --get-video-info 3Ul9gYweEPs

const { YOUTUBE_API_KEY } = process.env;

const args = parseArgs({
  options: {
    "get-video-info": {
      type: "string",
      short: "i",
    }
  },
});

const vid = args.values["get-video-info"];

getYouTubeVideoInfo({ vid });

const IVideoInfo = {
  kind: 'string',
  etag: 'string',
  id: 'string',
  snippet: {
    publishedAt: 'Date',
    channelId: 'string',
    title: 'string',
    description: 'string',
    thumbnails: {
      default: "object",
      medium: "object",
      high: "object",
      standard: "object",
      maxres: "object"
    },
    channelTitle: 'string',
    tags: [
      'string',
      'string'
    ],
    categoryId: "number",
    liveBroadcastContent: 'string',
    localized: {
      title: 'string',
      description: 'string'
    },
    defaultAudioLanguage: 'string'
  },
  contentDetails: {
    duration: 'string',
    dimension: 'string',
    definition: 'string',
    caption: 'boolean',
    licensedContent: "boolean",
    contentRating: "object",
    projection: 'string'
  }
}

async function getYouTubeVideoInfo({ vid }){

  const URL = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails%2C+snippet&id=${vid}&key=${YOUTUBE_API_KEY}`
  
  const resourceJSON = {}

  try {

    let data="";
    https.get(URL, function(response) {
    
      // console.log('statusCode:', response.statusCode);
      // console.log('headers:', response.headers);

      response
      .on("data", append => {
        data += append
      })
      .on("error", e => console.log(e) )
      .on("end", ()=> {

        const json = JSON.parse(data);
        
        if ( json.error ){
          return warn(json.error.message);
        }

        const videoInfo = json.items[0];

        let defaultAudioLanguage = null;

        if ( videoInfo.snippet.defaultAudioLanguage ){

          defaultAudioLanguage = videoInfo.snippet.defaultAudioLanguage.split("-")[0];

        }

        // videoInfo.contentDetails.caption // BOOLEAN
        console.log(videoInfo.snippet.description);

        const entrySlug = convertToKebabCase(videoInfo.snippet.title);

        resourceJSON[entrySlug] = {
          type: "YouTube",
          duration: iso8601ToSeconds(videoInfo.contentDetails.duration),
          title: videoInfo.snippet.title,
          date: formatDate(videoInfo.snippet.publishedAt),
          youtube : {
            id : videoInfo.id,
            channel_id: videoInfo.snippet.channelId,
            channel_title: videoInfo.snippet.channelTitle,
            thumbnail_url: videoInfo.snippet.thumbnails.standard.url
          },
          tags: videoInfo.snippet.tags
        }

        if ( defaultAudioLanguage ){
          resourceJSON[entrySlug].language = [ defaultAudioLanguage ]
        }

        // ok( JSON.stringify(resourceJSON, null, "\t"));
        const removeFirstTabs = /^\s{1}/gm;
        const output = JSON.stringify(resourceJSON, null, "\t")
        .split("\n")
        .map( line =>{
          return line.replace(removeFirstTabs, "");
        })
        .slice(1)
        .slice(0, -1)
        .join("\n")

        clipboardy.writeSync( output );
        console.log();
        ok( output );
        console.log();
        ok( "Content copied to clipboard. Just use Ctrl+V to paste." );

      });
    
    }).on("error", e =>{
      console.log(e);
    });

  } catch (error) {

    console.log("Ops!", { error });
    
  } 

  console.log("EoF");

}