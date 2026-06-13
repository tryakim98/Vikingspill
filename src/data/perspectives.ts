/**
 * perspectives.ts
 * Perspektivskifte på 4 utvalgte destinasjoner der kulturkollisjonen er sterkest.
 * Før gruppen velger, må de svare kort på to spørsmål — først fra vikingenes side,
 * deretter fra «de andres» side. Krever lærer-innstillingen `requirePerspective`.
 *
 * Spørsmålene tvinger frem perspektivtaking (kjernen i SAK01–03). Svarene lagres
 * sammen med saga-begrunnelsen, så læreren kan se hva gruppa tenkte.
 */

export interface PerspectivePrompt {
  vikingQuestion: string;
  otherQuestion: string;
  otherLabel: string;       // hvem «de andre» er, til saga-merking
}

export const PERSPECTIVE_PROMPTS: Record<string, PerspectivePrompt> = {
  lindisfarne: {
    vikingQuestion: 'Sett fra vikingenes side — hva er klokt å gjøre her, og hvorfor?',
    otherQuestion: 'Sett fra munkenes side — hvordan ser dette ut for dem som ber ved alteret når dere kommer i land?',
    otherLabel: 'munkene',
  },
  dublin: {
    vikingQuestion: 'Sett fra vikingenes side — hva er klokt å gjøre her, og hvorfor?',
    otherQuestion: 'Sett fra de gæliske irerne — hvordan ser det ut når nordmenn slår leir, gifter seg inn i kongefamilien, men også driver slavemarked?',
    otherLabel: 'irene',
  },
  sameland: {
    vikingQuestion: 'Sett fra vikingenes side — hva er klokt å gjøre her, og hvorfor?',
    otherQuestion: 'Sett fra samenes side — hva betyr det at fremmede kommer for å handle (eller kreve finnskatt) i sii\'daen deres?',
    otherLabel: 'samene',
  },
  baghdad: {
    vikingQuestion: 'Sett fra vikingenes side — hva er klokt å gjøre her, og hvorfor?',
    otherQuestion: 'Sett fra arabernes side — hvordan så Ibn Fadlan på dere? Hva ville han notert om deres skikker?',
    otherLabel: 'araberne',
  },
};
