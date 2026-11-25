import type { SkillKey } from "../types";
import type { Content, Group, GroupView } from "./model";
export const TOPIC_LABEL: Record<SkillKey, string> = {
  språk: "Språk og kilder",
  sjømannskap: "Seilas og ruter",
  krigskunst: "Makt og konflikt",
  diplomati: "Handel og avtaler",
  tro: "Tro og perspektiver",
};
type TrialRoute = { ports: string[]; title: string; practice: string };
export const TRIAL_ROUTES: Record<SkillKey, [TrialRoute, TrialRoute]> = {
  språk: [
    {
      ports: ["hedeby", "hebrides"],
      title: "Markedets tolk",
      practice:
        "Lag en 45-sekunders markedspitch i Hedeby med ett språklig spor fra Hebridene. Vis først en misforståelse, og rett den ved å gjenta avtalen. Alle bidrar med én detalj. Lever: hva var kildebasert, hva fant dere på, og hvordan sjekket dere forståelsen?",
    },
    {
      ports: ["hedeby", "hebrides", "novgorod"],
      title: "Reiseguiden som sjekket sporene",
      practice:
        "Lag en liten handelsguide fra Hedeby via et navnespor i Hebridene til Novgorod. Velg én sikker opplysning og én usikker for hvert sted. Fremfør 60 sekunder som reiseguider, og la alle forklare et spor eller stille et kontrollspørsmål. Lever en kildehenvisning og én rettelse dere gjorde underveis.",
    },
  ],
  sjømannskap: [
    {
      ports: ["hebrides", "faroyene"],
      title: "Når sikten forsvinner",
      practice:
        "Lag en rute fra Hebridene til Færøyene med forsyninger og et alternativ ved uvær. En medspiller melder «sikten forsvinner», og alle foreslår én endring. Vis kartskissen i 45 sekunder. Lever to opplysninger fra reisen, én usikkerhet og hvorfor reserveplanen er rimelig.",
    },
    {
      ports: ["hebrides", "faroyene", "island"],
      title: "Skipet før neste havstrekk",
      practice:
        "Forbered et oppdiktet skip ved Island med erfaringene fra Hebridene og Færøyene. Dere får beskjed om mindre proviant og må velge hva som endres eller om dere venter. Alle foreslår ett hensyn. Lever en kartskisse, en felles beslutning og to konkrete opplysninger fra besøkene som støtter den.",
    },
  ],
  krigskunst: [
    {
      ports: ["lindisfarne", "paris"],
      title: "Det som står på spill",
      practice:
        "Vis samme oppdiktede konflikt i to stillbilder: angrep og forhandling. Bruk erfaringer fra Lindisfarne og Paris. Alle bidrar som forteller, tegner eller aktør. Forklar hva begge parter kan tape, og lever én kildebasert opplysning fra hvert sted som endret vurderingen deres.",
    },
    {
      ports: ["lindisfarne", "paris", "dublin"],
      title: "Rådet etter konflikten",
      practice:
        "Lag et 60-sekunders rådsmøte om et oppdiktet valg mellom press og avtale. Hvert medlem viser til en erfaring fra Lindisfarne, Paris eller Dublin. Lever en beslutning, ett motargument og hvordan konsekvenser for andre enn vinneren påvirket valget. Skill kildestøtte fra scenen dere fant på.",
    },
  ],
  diplomati: [
    {
      ports: ["hedeby", "paris"],
      title: "Avtalen som begge forstår",
      practice:
        "Lag en oppdiktet bytte- og adgangsavtale med erfaringer fra Hedeby og Paris: vare, mengde, vilkår og håndtering av avtalebrudd. Alle stiller ett kritisk spørsmål. Fremfør avtalen på 45 sekunder og lever én forbedring etter spørsmålene, med en opplysning fra hver havn som begrunnelse.",
    },
    {
      ports: ["hedeby", "paris", "dublin"],
      title: "Avtalen med en tredje stemme",
      practice:
        "Utvid en oppdiktet avtale med et hensyn til noen som ikke var med ved forhandlingsbordet. Bruk markedet i Hedeby, konflikten ved Paris og perspektivene i Dublin. Alle bidrar med ett vilkår eller motargument. Lever avtalen og forklar hvem den gagner, hvem den kan ramme og hva kildene ikke gir svar på.",
    },
  ],
  tro: [
    {
      ports: ["lindisfarne", "sameland"],
      title: "Museet med to lydguider",
      practice:
        "Lag to korte museumstekster eller lydguider med erfaringer fra Lindisfarne og Sápmi. Forklar hvordan en gjenstand eller tradisjon kan bety noe utover pris, uten å spille hellige ritualer. Alle bidrar med et spørsmål eller en setning. Lever hva dere vet fra kilder og hva dere fortsatt er usikre på.",
    },
    {
      ports: ["lindisfarne", "sameland", "dublin"],
      title: "Utstillingen som lot flere fortelle",
      practice:
        "Lag en ettminutts utstillingstale om kontakt og ulike perspektiver med eksempler fra Lindisfarne, Sápmi og Dublin. Alle bidrar, og hvert sted får én kildebasert opplysning. Lever en påstand dere bevisst tonet ned, hvorfor dere gjorde det og ett perspektiv som mangler i kildene.",
    },
  ],
};
export function trialRoute(skill: SkillKey, level: 1 | 2) {
  return TRIAL_ROUTES[skill][level - 1];
}
export function trialAvailability(group: Group | GroupView, skill: SkillKey) {
  const level = Math.min(2, group.svennebrev[skill] + 1) as 1 | 2;
  const route = trialRoute(skill, level);
  const missing = route.ports.filter((id) => !group.visited.includes(id));
  return {
    level,
    route,
    missing,
    available: group.svennebrev[skill] < 2 && missing.length === 0,
  };
}
export function journeyTrialBank(
  content: Content,
  skill: SkillKey,
  level: 1 | 2,
) {
  return trialRoute(skill, level).ports.flatMap(
    (id) => content.journey[id].questions,
  );
}
export function trialBank(
  trial: NonNullable<Group["trial"]>,
  content: Content,
) {
  return trial.bankVersion === "journey-v1"
    ? journeyTrialBank(content, trial.skill, trial.level)
    : content.skillQuestions[trial.skill][
        trial.level === 1 ? "tier2" : "tier3"
      ];
}
