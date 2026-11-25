import { build } from "esbuild";
import { mkdir, writeFile, rm } from "node:fs/promises";

// One-time reproducible migration; the original JSON files remain unchanged.
const temporary = new URL("../.content-migration.mjs", import.meta.url);
await build({
  stdin: {
    contents: "export { destinations } from './src/data/legacyDestinations.ts'",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: temporary.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' },
});
const { destinations } = await import(temporary.href);
const specific = {
  lindisfarne: [
    "English Heritage: angrepet på Lindisfarne",
    "https://www.english-heritage.org.uk/visit/places/lindisfarne-priory/History/viking-raid/",
    "Angrepet i 793. Dokumenterer ikke dialogen eller de alternative spillutfallene.",
  ],
  hedeby: [
    "Vikingeskibsmuseet: Haithabu",
    "https://www.vikingeskibsmuseet.dk/en/professions/education/the-longships/findings-of-longships-from-the-viking-age/the-longship-from-haithabu-harbour",
    "Hedeby som handelssted og arkeologiske skipsfunn.",
  ],
  vinland: [
    "Parks Canada: L’Anse aux Meadows",
    "https://parks.canada.ca/culture/designation/lieu-site/anse-aux-meadows",
    "Arkeologisk dokumentasjon av norrøn tilstedeværelse; sagadialogen er dramatisering.",
  ],
};
const cautions = {
  lindisfarne:
    "Plyndring er dokumentert historie, ikke et moralsk fasitsvar. «Hæren to dager unna» i kortene er fiksjon.",
  hedeby:
    "Handel er godt dokumentert. Prisøkninger, aktørenes ord og eksakte gevinster er spillfiksjon.",
  dublin:
    "Bosetning, handel og vold må ses sammen. Påstander om bestemte ekteskap og DNA krever egne kilder.",
  paris:
    "Spillet komprimerer beleiringer og normannisk bosetning fra forskjellige år. Disse er ikke ett samtidighetsbilde.",
  hebrides:
    "Norrønt-gæliske kulturmøter strekker seg over tid; Somerled er fra 1100-tallet, utenfor vanlig vikingtid.",
  sameland:
    "Ottar er en utenfrastemme, ikke dokumentasjon av samenes samtykke. Snøfrid-fortellingen er sagatradisjon.",
  faroyene:
    "Tidlig bosetning og irsk tilstedeværelse har usikker kronologi. Grim Kamban er en sagaskikkelse.",
  island:
    "Alltinget var ikke et demokrati med dagens stemmerett. Sagaer er senere fortellinger, ikke ordrette samtaler.",
  vinland:
    "Norrøn tilstedeværelse er arkeologisk belagt. Sagahendelser og folks motiver må skilles fra funnene.",
  novgorod:
    "Fortellingen om Ruriks invitasjon er en senere krøniketradisjon, ikke et sikkert referat fra 862.",
  baghdad:
    "Ibn Fadlan møtte rus ved Volga, ikke en vikingdelegasjon ved kalifens port i Bagdad. Scenen er konstruert.",
  miklagard:
    "Væringgarden og Harald Hardråde tilhører ulike perioder. Sammensatte hendelser er dramatisert.",
};
const roleTasks = {
  språk:
    "Finn et ord eller en skikk som kan misforstås. Forklar både hva teksten sier og din tolkning.",
  sjømannskap:
    "Finn en geografisk eller praktisk risiko. Forklar hvordan den bør påvirke mannskapets valg.",
  krigskunst:
    "Finn hvem som har makt og hvem som kan bli skadet. Begrunn et alternativ til ren maktbruk.",
  diplomati:
    "Finn begge parters interesser. Forklar hva en konkret, gjensidig avtale kan bygge på.",
  tro: "Finn en religiøs eller kulturell forventning. Forklar hvordan den andre parten kan forstå situasjonen.",
};
const packs = destinations.map((port) => ({
  version: 1,
  port,
  sources: [
    {
      id: "game-material",
      title: "Fortellingen og faktafeltene i spillet",
      url: "https://github.com/tryakim98/Vikingspill/tree/c96163165e8c636586ebc3e1ebe7e7b1fc5c350a",
      scope:
        "Undervisningsmateriale fra originalen; fortellingen, opplysningene i kortene og terningutfallene er dramatiserte og må etterprøves.",
    },
    ...(specific[port.id]
      ? [
          {
            id: `${port.id}-museum`,
            title: specific[port.id][0],
            url: specific[port.id][1],
            scope: specific[port.id][2],
          },
        ]
      : []),
  ],
  editorial: {
    scenes: "dramatized",
    reviewStatus: "needs-historical-review",
    caution: cautions[port.id],
    historicalComparison: port.historicalChoiceId
      ? `Spillet knytter «${port.choices.find((c) => c.id === port.historicalChoiceId)?.title}» til et historisk mønster. Undersøk hva kildene støtter, og hvilke deler som er forenklet. Det gir ingen automatisk faglig bonus.`
      : "Sammenlign valget deres med en kilde. Skill mellom dokumenterte hendelser, senere fortellinger og det spillet har funnet på.",
  },
  roleTasks,
}));
await mkdir("src/content", { recursive: true });
await writeFile(
  "src/content/packs.json",
  JSON.stringify(packs, null, 2) + "\n",
);
await rm(temporary);
console.log(`Migrerte ${packs.length} havnepakker. Originaldata er beholdt.`);
