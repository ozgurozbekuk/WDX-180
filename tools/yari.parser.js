// DESCRIPTION: Script to parse MDN markdown content. Looks for patterns such as {{LearnSidebar}}, {{Glossary}}, etc.

// 0) IMPORTS: =================================================================
const path               = require("node:path");
const fs                 = require("node:fs");
const { parseArgs }      = require("node:util");
// https://pawelgrzybek.com/til-node-js-18-3-comes-with-command-line-arguments-parser/
const { warn, ok, info } = require("./utils");
const marked             = require("marked");
const matter             = require('gray-matter');

// 1) OUR FUNCTIONS: ===========================================================

/**
 * TODO: ADD TESTS
 * @param {string} textContent 
 * @returns string
 */
function removeTemplateContent( textContent ){

  // Thank you ChatGPT! 
  // const templateRegex = /{{QuicklinksWithSubPages\("[A-Za-z_\/]+"\)}}\s*\n|{{GlossarySidebar}}\s*\n|{{LearnSidebar}}|{{(?:LearnSidebar)?(?:PreviousMenuNext|PreviousMenu|NextMenuPrevious)\(["'][^"']*["'],\s*["'][^"']*["'],\s*["'][^"']*["']\)}}\s*\n/g;

  const templateRegex = /{{QuicklinksWithSubPages\("[A-Za-z_\/]+"\)}}\s*\n|{{GlossarySidebar}}\s*\n|{{LearnSidebar}}|{{(?:LearnSidebar)?(?:PreviousMenuNext|NextMenu|PreviousMenu|NextMenuPrevious)\([^)]+\)}}\s*\n/g;

  const nextMenuSingleRegex = /{{NextMenu\("[^"]+", "[^"]+"\)}}/g;
  // const templateRegex = /{{PreviousMenu\([^)]+\)}}\s*\n/g

  const templateMatches = textContent.match(templateRegex); 

  if ( templateMatches ){
    console.log( templateMatches )
    ok("Substituted {{Template}} matches successfully");
    textContent = textContent.replace(templateRegex, "");
  }

  const nextMenuMatches = textContent.match(nextMenuSingleRegex);

  if ( nextMenuMatches ){

    console.log( nextMenuMatches )
    ok("Substituted {{Template}} matches successfully");
    textContent = textContent.replace(nextMenuMatches, "");

  }

  const previousMenuNextRegex = /\{\{PreviousMenuNext\((?:"[^"]+"(?:,\s*)?)+\)\}\}\n/g;
  const previousMenuNextRegexMatches = textContent.matchAll(previousMenuNextRegex);

  if ( previousMenuNextRegexMatches ){
    for ( const match of previousMenuNextRegexMatches ){
      ok( "\nFound: " + match[0] );      
      textContent = textContent.replace( match[0], "" );
    }
  }

  return textContent;

}

function replaceHTMLGlossaryLinks( textContent, fileName ){

  // Thank you ChatGPT! 
  const glossaryRegex = /(<[^>]*>)\{\{[Gg]lossary\("([^"]+)"(?:,\s*"([^"]+)")?\)\}\}(<\/[^>]*>)/g;

  function replaceGlossary(match, openingTag, p1, p2, closingTag) {
    // console.log({ p1, p2, openingTag, closingTag });
    // TODO: Replace MDN domain with local resources/glossary path if available
    let baseLink = "https://developer.mozilla.org/en-US/docs/Glossary/";
    let link = "";

    const glossaryDirectory = path.join(__dirname, '..', "resources", "glossary", `${p1}.md`);

    if (fs.existsSync(glossaryDirectory)){
      // Count the number of remaining path segments
      const subfolderCount = fileName.split(path.sep).length - 1;
      const parentPaths = Array.from({ length: subfolderCount}).fill( "../" ).join("");
      link = `${parentPaths}resources/glossary/${p1}.md`
      console.log(`Local glossary entry for ${p1} exists.`); 
    } else {
      link = `${baseLink}${p1[0].toUpperCase() + p1.slice(1).replace(/\s+/g, "_")}`;
    }

    const output = `${openingTag}<a href="${link}">${ p2 ? p2 : p1}</a>${closingTag}`;
    // console.log({ match, output });
    // console.log(match, p1, p2);
    return output;
  }

  if ( textContent.match(glossaryRegex) ){
    ok("Substituted {{Glossary}} matches successfully");
    return textContent.replace(glossaryRegex, replaceGlossary);
  } 

  info("\n No HTML {{Glossary}} matches found on this file");
  return textContent;

}

function replaceGlossaryLinks( textContent, fileName ){

    // Thank you ChatGPT! 
    const glossaryRegex = /\{\{[Gg]lossary\("([^"]+)"(?:,\s*"([^"]+)")?\)\}\}/g;

    function replaceGlossary(match, p1, p2) {
      // TODO: Replace MDN domain with local resources/glossary path if available
      let baseLink = "https://developer.mozilla.org/en-US/docs/Glossary/";
      let link = "";

      const glossaryDirectory = path.join(__dirname, '..', "resources", "glossary", `${p1}.md`);

      if (fs.existsSync(glossaryDirectory)){
        // Count the number of remaining path segments
        const subfolderCount = fileName.split(path.sep).length - 1;
        const parentPaths = Array.from({ length: subfolderCount}).fill( "../" ).join("");
        link = `${parentPaths}resources/glossary/${p1}.md`
        console.log(`Local glossary entry for ${p1} exists.`); 
      } else {
        link = `${baseLink}${p1[0].toUpperCase() + p1.slice(1).replace(/\s+/g, "_")}`;
      }
  
      const output = p2 ? `[${p2}](${link})` : `[${p1}](${link})`;
      // console.log(match, p1, p2);
      return output;
    }

    if ( textContent.match(glossaryRegex) ){
      ok("Substituted {{Glossary}} matches successfully");
      return textContent.replace(glossaryRegex, replaceGlossary);
    } 

    info("\n No {{Glossary}} matches found on this file");
    return textContent;
  
}

function replaceDOMXrefLinks( textContent, fileName ){

  // Thank you ChatGPT! 
  const glossaryRegex = /\{\{domxref\("([^"]+)"(?:,\s*"([^"]+)")?\)\}\}/g;

  function replaceGlossary(match, p1, p2) {
    // console.log({ match, p1, p2 });
    // TODO: Replace MDN domain with local resources/glossary path if available
    let baseLink = "https://developer.mozilla.org/en-US/docs/Web/API/";
    let link = "";

    // const glossaryDirectory = path.join(__dirname, '..', "resources", "glossary", `${p1}.md`);

    // TODO: UPDATE TO REFLECT Document/ FOLDER FOR LOCAL OFFLINE FILES
    if ( false && fs.existsSync(glossaryDirectory) ){

      // Count the number of remaining path segments
      const subfolderCount = fileName.split(path.sep).length - 1;
      const parentPaths = Array.from({ length: subfolderCount}).fill( "../" ).join("");
      link = `${parentPaths}resources/glossary/${p1}.md`
      console.log(`Local glossary entry for ${p1} exists.`); 

    } else {

      let base = "";
      let term = "";

      if ( p1.includes(".") ){

        [ base, term ] = p1.split(".");

      }

      if ( p1.includes("/") ){

        [ base, term ] = p1.split("/");

      }

      if ( p1.includes(" ") ){

        [ base, term ] = p1.split(" ");

        console.log({ base, term });

        base = `${base}_${term}`;
        term = null;

      }

      link = term ? `${baseLink}${base}/${term}` : `${baseLink}${base}`;
    
    }

    const output = p2 ? `[${p2}](${link})` : `[${p1}](${link})`;
    return output;
  }

  if ( textContent.match(glossaryRegex) ){
    ok("Substituted {{Glossary}} matches successfully");
    return textContent.replace(glossaryRegex, replaceGlossary);
  } 

  info("\n No {{Glossary}} matches found on this file");
  return textContent;

}

function parseMDNLinks( textContent ){
  const domain = "https://developer.mozilla.org"
  const regex = /\[([^\]]+)\]\((\/en-US\/docs\/[^\)]+)\)/g;
  const matches = textContent.match(regex);
  if ( matches ){
    console.log( matches );
    // return textContent.replace( regex )
    return textContent.replace(regex, (match, linkText, url) => {
      // console.log( match ); // [...](...)
      // console.log( linkText); // Link label
      // console.log( url ); // Link URL: /en-us/docs/...
      const newUrl = domain + url;
      return `[${linkText}](${newUrl})`;
    });
  }

  return textContent;
}

function parseImages( textContent ){

  const regex = /!\[([^\]]*)]\(((?!https?:\/\/)[^\)]+)\)/g;
  
  const matches = textContent.match(regex);
  
  if (matches) {
    return textContent.replace( regex, (match, altText, imgSrc)=>{
      if ( imgSrc.startsWith("assets") ){
        return match;
      }
      return `![${altText}](assets/${imgSrc})`
    })
  }
  
  return textContent;
}

function parseElementTerm( textContent ){

  const URL = "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/";
  const pattern = /{{(htmlelement|HTMLElement)\("(.*?)"(?:, "(.*?)")?\)}}/g;
  return textContent.replace(pattern, ( match, _, termA, termB )=>{
    const link = `${URL}${termA}`;
    return `[\`<${termB ? termB : termA}>\`](${link})`;
  })
}

function parseCSSTerm( textContent ){
  // {{cssxref("width")}}
  //=> https://developer.mozilla.org/en-US/docs/Web/CSS/width
  const domain = "https://developer.mozilla.org/en-US/docs/Web/CSS/";
  const regex = /{{cssxref\("([^"]+)"\)}}/g;
  return textContent.replace( regex, (match, cssTerm)=>{
    return `[\`${cssTerm}\`](${domain}${cssTerm})`
  })
}

function parseHTTPStatus( textContent ){
  const URL = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/";
  const pattern = /{{(HTTPStatus)\("(.*?)"(?:, "(.*?)")?\)}}/g;
  return textContent.replace(pattern, ( match, _, termA, termB )=>{
    const link = `${URL}${termA}`;
    const output = `[${termB ? termB : termA}](${link})`;
    // console.log({ output }); 
    return output;
  })
}

function parseHTTPHeader( textContent ){
  const URL = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/";
  const pattern = /{{(HTTPHeader)\("(.*?)"(?:, "(.*?)")?\)}}/g;
  return textContent.replace(pattern, ( match, _, termA, termB )=>{
    const link = `${URL}${termA}`;
    const output = `[${termB ? termB : termA}](${link})`;
    console.log();
    info(`Found: ${match}`); 
    console.log();
    return output;
  })
}

function parseEmbedYouTube( textContent ){
  
  const youtubeRegex = /\{\{EmbedYouTube\("([a-zA-Z0-9-_]{11})"\)\}\}/g;

  const matches = textContent.matchAll( youtubeRegex );
  const iframe = (vid)=> {

    const iframe = `
    <iframe 
      width="560" 
      height="315" 
      src="https://www.youtube-nocookie.com/embed/${vid}" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen="" 
      loading="lazy">
    </iframe>`.trim();

    const externalLink = `
    <p><a href="https://www.youtube.com/watch?v=${vid}" target="_blank">
        [ Watch on <strong>YouTube</strong> ]
      </a>
    </p>`.split("\n").map( s => s.trim() ).join("\n");

    return iframe + "\n" + externalLink;

  }
  
  if ( matches ){
    for ( const match of matches ){
      info( "Found: " + match[0] );
      textContent = textContent.replace(match[0], iframe(match[1]))
    }
  }

  return textContent;

}

function parseEmbedGHLiveSample( textContent ){
  const regex = /\{\{EmbedGHLiveSample\((['"])(?<first>.*)\1(,\s?(['"])(?<second>.*)\4)?(,\s?(?<third>.*))?\)\}\}/gm
  const matches = textContent.matchAll(regex);
  const domainMDN = "https://mdn.github.io/";
  const domain = "https://in-tech-gration.github.io/";
  if ( matches ){
    for ( const match of matches ){
      // PARSE css-examples:
      if ( match.groups.first.indexOf("css-examples/") === 0 ){
        // console.log( match[0] ); // <- Replace this
        // console.log( match.groups.first );
        // console.log( match.groups.second );
        // console.log( match.groups.third );
        const iframe = `
          <iframe 
            class="EmbedGHLiveSample" 
            loading="lazy"
            src="${domain}${match.groups.first}" 
            width="${match.groups.second}" 
            height="${match.groups.third}"></iframe>
        `.trim();

        const externalLink = `
        <p><a href="${domain}${match.groups.first}" target="_blank">
            [ External link ]
          </a>
        </p>`.split("\n").map( s => s.trim() ).join("\n");

        textContent = textContent.replace(
          match[0], 
          iframe + "\n" + externalLink 
        );

      }
    }
  }
  return textContent;
}

function getEmbedLiveSampleRegex(){

  //  $4 - (Deprecated) The slug from which to load the sample (optional; current page used if not provided)
  //  $5 - (Deprecated) The class name of the frame; defaults to "sample-code-frame". If you
  //       pass this parameter and give it a value other than "sample-code-frame",
  //       then the "Open in CodePen"/"Open in JSFiddle" buttons will not be displayed.
  //  $6 - (Deprecated) Allowed features, separated by semicolons (optional)

  const optCommaSpace = `(?:,\\s)`;
  const optQuotes     = `(['"])?`;
  const rxFirstGroup  = `\\{\\{\\s*EmbedLiveSample\\((['"])(?<header_block_id>.*?)\\1`;
  const rxSecondGroup = `(?:${optCommaSpace}(?<iframe_width>\\d+))?`;
  const rxThirdGroup  = `(?:${optCommaSpace}(?<iframe_height>\\d+))?`;
  const rxFourthGroup = `(?:${optCommaSpace}${optQuotes}(?<screenshot_url>[^'"]+)\\5)?`;
  const rxFifthGroup  = `(?:${optCommaSpace}${optQuotes}(?<slug>[^'"]+)\\7)?`
  const rx = new RegExp(
    rxFirstGroup 
    + rxSecondGroup 
    + rxThirdGroup  
    + rxFourthGroup 
    + rxFifthGroup  
    // + `(?:\s+)?\\)\}\}` // TODO
    // , "gm"
  );

  return rx;
}

function parseEmbedLiveSample( textContent ){

  // Use Global regex pattern
  const rx = new RegExp( getEmbedLiveSampleRegex().source, "gm" );

  const matches = textContent.matchAll(rx);

  if ( matches ){

    console.log();

    for ( const match of matches ){

      info( `Found EmbedLiveSample: ${match[0]}` );

      const { header_block_id, iframe_width, iframe_height, screenshot_url, slug } = match.groups;

      if ( header_block_id ){
        // console.log({ header_block_id });
      }
      if ( iframe_width ){
        // console.log({ iframe_width });
      }
      if ( iframe_height ){
        // console.log({ iframe_height });
      }
      if ( screenshot_url ){
        // console.log({ screenshot_url });
      }
      if ( slug ){
        // console.log({ slug });
      }
    }
  }
  return textContent;
}

// 2) OUR VARIABLES: ===========================================================

// 3) ACTION!!! ================================================================

// Orchestrate Parsing & Modifications
function parseYariDynamicContent( textContent, fileName ){

  let updatedContents = textContent;

  // Parse markdown and separate Frontmatter and main content:
  const { content, data: fm } = matter( textContent );
  // Parse markdown tokens:
  const markdownTokens        = marked.lexer(content);

  // Parsing EmbedLiveSamples
  // DOCS: https://github.com/mdn/yari/blob/main/kumascript/macros/EmbedLiveSample.ejs
  let code = {
    html: null,
    css: null,
    js: null,
  };

  const liveSamples = [];

  markdownTokens.forEach((t,idx) =>{
    // console.log( t.type, t.lang );
    if ( t.raw.indexOf("EmbedLiveSample") > -1 ){
      console.log();
      const m = t.raw.match( getEmbedLiveSampleRegex() );
      // console.log( m[0], m.groups, idx );
      console.log({ header_block_id: m.groups.header_block_id });
      console.log({ iframe_width: m.groups.iframe_width });
      console.log( m.groups.iframe_height );
      console.log( m.groups.screenshot_url );
      console.log( m.groups.slug );
      console.log( markdownTokens[idx-1].type, markdownTokens[idx-1].lang );
      console.log( markdownTokens[idx-2].type, markdownTokens[idx-2].lang );
      console.log( markdownTokens[idx-3].type, markdownTokens[idx-3].lang );
      console.log( markdownTokens[idx-4].type, markdownTokens[idx-4].lang );
      console.log( markdownTokens[idx-5].type, markdownTokens[idx-5].lang );
      console.log( markdownTokens[idx-6].type, markdownTokens[idx-6].lang );
    }
  })
  // console.log({ markdownTokens });
  // type: "code" + lang: "js hidden", "css hidden" => type: "space", raw: "\n\n" => type: "paragraph" => EmbedLiveSample

  // Run this first:
  updatedContents = replaceHTMLGlossaryLinks(updatedContents, fileName);
  // Then run this one:
  updatedContents = replaceGlossaryLinks(updatedContents, fileName);
  updatedContents = removeTemplateContent(updatedContents);
  updatedContents = parseMDNLinks(updatedContents);
  updatedContents = parseImages(updatedContents);
  updatedContents = parseElementTerm(updatedContents);
  updatedContents = parseCSSTerm(updatedContents);
  updatedContents = parseHTTPStatus(updatedContents);
  updatedContents = replaceDOMXrefLinks(updatedContents);
  updatedContents = parseHTTPHeader(updatedContents);
  updatedContents = parseEmbedYouTube(updatedContents);
  updatedContents = parseEmbedGHLiveSample(updatedContents);
  // updatedContents = parseEmbedLiveSample(updatedContents);

  return updatedContents;

}

if (require.main === module) {
  // console.log("This script was executed directly.");
  init();
} else {
  // console.log("This script was imported as a module.");
}

function init(){

  const fileName = process.argv[2];

  if ( !fileName ){
    warn("No filename.")
    process.exit();
  }

  try {
  
    console.log(`Processing ${fileName}`);
    
    const file = fs.readFileSync(fileName, "utf-8");
    fs.writeFileSync( fileName, parseYariDynamicContent(file, fileName), "utf8" );
  
  } catch(e){
  
    warn(e.message);
  
  }

}

// 4) EXPORT SECTION: ==========================================================

module.exports = {
  parseYariDynamicContent,
  parseMDNLinks,
  parseHTTPStatus,
  parseEmbedLiveSample,
  parseEmbedGHLiveSample,
  parseHTTPHeader,
  parseImages,
  parseElementTerm,
  parseCSSTerm,
  replaceHTMLGlossaryLinks,
  replaceDOMXrefLinks
};