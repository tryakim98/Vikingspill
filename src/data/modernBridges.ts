/**
 * modernBridges.ts
 * «Bro til i dag» — kort refleksjon etter utfallet som kobler kulturmøtet til
 * en relevant samtidssak. Hjelper elevene se at vikingtidens valg har gjenklang
 * i dagens debatter. Lærer slår på via `requireBridge`-innstillingen.
 *
 * Fire destinasjoner: Sameland, Vinland, Bagdad, Dublin.
 */

export interface ModernBridge {
  topic: string;     // kort tittel på samtidsbroen
  context: string;   // 1-2 setninger som etablerer koblingen
  prompt: string;    // refleksjonsspørsmålet
  options: string[]; // 3-4 ferdigformulerte refleksjoner gruppa kan velge fra
}

export const MODERN_BRIDGES: Record<string, ModernBridge> = {
  sameland: {
    topic: 'Sannhets- og forsoningskommisjonen (2023)',
    context: 'I 2023 leverte Norges Sannhets- og forsoningskommisjon sin rapport om fornorskingspolitikken — over hundre års forsøk på å viske ut samisk språk, navn og religion.',
    prompt: 'Hva er forskjellen på vikingenes møte med samene og statens senere fornorskingspolitikk — og hva er likt?',
    options: [
      'Vikinger og samer handlet ofte som likeverdige; staten senere prøvde å gjøre samene til «nordmenn». Tegnet på likeverd er bytte, tegnet på undertrykking er at den ene siden bestemmer.',
      'Begge handler om at den sterkeste parten kan bestemme hvilken kultur som teller. Forskjellen er hvor langt staten gikk for å fjerne den andre.',
      'Sannhetskommisjonen viser at konsekvensene av kulturmøter kan komme langt seinere. Det vi gjør i dag, husker noen i morgen.',
    ],
  },
  vinland: {
    topic: 'Kolonisering og urfolks rettigheter',
    context: 'Vikingene møtte skrælinger i Vinland rundt år 1000 og dro hjem etter få år. Fem hundre år senere kom andre europeere til samme kontinent — med en ganske annen agenda. I dag er urfolksspørsmål sentrale i Canada, Norge, Australia, USA.',
    prompt: 'Hva skiller en kortvarig handelskontakt (vikingene) fra langvarig kolonisering (senere europeere)?',
    options: [
      'Vikinger handlet, mislyktes med å bosette seg, og dro hjem. Senere europeere kom for å bli — og fortrengte urfolket.',
      'Begge undervurderte urfolkets makt og kunnskap først. Forskjellen er om man drar når man taper, eller blir for å overta.',
      'Vinland ble glemt; kolonisering etterlot dype sår som tar generasjoner å lege. Hvor varig kontakten varer, avgjør hvor mye den endrer.',
    ],
  },
  baghdad: {
    topic: 'Globalisering — før og nå',
    context: 'På 900-tallet bandt Volga-veien Skandinavia til Bagdad. Vikinger byttet pels og sølv mot krydder og bøker. I dag knytter globale verdikjeder de samme områdene sammen — bare raskere, billigere, og med flere mellomledd.',
    prompt: 'Hva er likt med vikingenes handel og dagens globalisering?',
    options: [
      'Begge gjør oss avhengige av fjerne steder for varer vi tar for gitt.',
      'Begge fører til kulturmøter som endrer begge sider — språk, mat, religion, identitet.',
      'Globalisering i dag flytter milliarder per dag; vikinger flyttet sølv. Skalaen er ny, prinsippet det samme.',
    ],
  },
  dublin: {
    topic: 'Migrasjon og blandingskulturer',
    context: 'Norrøne menn slo seg ned i Dublin, giftet seg inn i irske slekter, lærte gælisk og ble kristne. De ble Norse-Gaels — en helt ny kultur. I dag har én av fem nordmenn innvandrerbakgrunn.',
    prompt: 'Hvordan blir to kulturer til én ny? Hva må til?',
    options: [
      'Tid. Den norrønt-gæliske blandingen tok 200 år å forme — det skjer ikke over én generasjon.',
      'Likeverdig deltakelse. Hvis bare den ene siden gir slipp, blir det erstatning, ikke blanding.',
      'Felles utfordringer. Når begge må overleve sammen, mister grenser noe av betydningen.',
    ],
  },
};
