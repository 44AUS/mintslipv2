// Real fonts for the resume PDF generator. jsPDF only ships helvetica, times
// and courier, so the other choices embed a bundled TTF: Carlito and Arimo are
// the metric-compatible open versions of Calibri and Arial, Montserrat is the
// real thing. Files are fetched lazily and cached, so the bundle stays small
// and a font costs one request the first time it's used.
import carlitoRegular from "../assests/fonts/Carlito-Regular.ttf";
import carlitoBold from "../assests/fonts/Carlito-Bold.ttf";
import arimoRegular from "../assests/fonts/Arimo-Regular.ttf";
import arimoBold from "../assests/fonts/Arimo-Bold.ttf";
import montserratRegular from "../assests/fonts/Montserrat-Regular.ttf";
import montserratBold from "../assests/fonts/Montserrat-Bold.ttf";

const CUSTOM_FONTS = {
  Calibri: { family: "Carlito", normal: carlitoRegular, bold: carlitoBold },
  Arial: { family: "Arimo", normal: arimoRegular, bold: arimoBold },
  Montserrat: { family: "Montserrat", normal: montserratRegular, bold: montserratBold },
};

const BUILTIN_FONTS = {
  Helvetica: "helvetica",
  "Times New Roman": "times",
};

const base64Cache = {}; // url -> base64 string promise

function fetchFontBase64(url) {
  if (!base64Cache[url]) {
    base64Cache[url] = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin);
      })
      .catch((e) => {
        delete base64Cache[url]; // allow a retry next time
        throw e;
      });
  }
  return base64Cache[url];
}

// Register the chosen font on a jsPDF doc and return the family name to pass
// to doc.setFont(). Falls back to built-in helvetica if the TTF can't load.
export async function ensureResumeFont(doc, fontName) {
  const custom = CUSTOM_FONTS[fontName];
  if (!custom) return BUILTIN_FONTS[fontName] || "helvetica";
  try {
    const [normal, bold] = await Promise.all([
      fetchFontBase64(custom.normal),
      fetchFontBase64(custom.bold),
    ]);
    doc.addFileToVFS(`${custom.family}-Regular.ttf`, normal);
    doc.addFont(`${custom.family}-Regular.ttf`, custom.family, "normal");
    doc.addFileToVFS(`${custom.family}-Bold.ttf`, bold);
    doc.addFont(`${custom.family}-Bold.ttf`, custom.family, "bold");
    return custom.family;
  } catch (e) {
    console.error(`Resume font ${fontName} failed to load, using helvetica`, e);
    return "helvetica";
  }
}
