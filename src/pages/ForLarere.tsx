/**
 * ForLarere.tsx — kort, vennlig side til kollegaer som vurderer å bruke spillet.
 *
 * Ligger på /for-larere. Bruker samme norrøn-design som resten av appen.
 * Ingenting kobles til Firebase her — bare statisk infotekst og en lenke
 * inn til rollevalget.
 */

import { Link } from 'react-router-dom';
import { ThorHammer, Raven, Yggdrasil, Vegvisir, RuneDivider, KnotBorder } from '../components/decor';

interface StepProps {
  num: string;
  title: string;
  body: React.ReactNode;
}

function Step({ num, title, body }: StepProps) {
  return (
    <li className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-viking-gold bg-viking-darkblue font-saga text-lg font-bold text-viking-gold">
        {num}
      </span>
      <div>
        <h3 className="font-cinzel text-lg font-bold text-viking-gold">{title}</h3>
        <div className="mt-1 font-inter text-viking-paper/90">{body}</div>
      </div>
    </li>
  );
}

function Tip({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="font-cinzel text-xl text-viking-gold">{icon}</span>
      <span className="font-inter text-viking-paper/90">{text}</span>
    </li>
  );
}

export default function ForLarere() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-viking-coal text-viking-paper">
      {/* Bakgrunn — gradient + Yggdrasil */}
      <div className="absolute inset-0 viking-screen" />
      <div className="pointer-events-none absolute left-1/2 top-32 -translate-x-1/2 opacity-[0.06]">
        <Yggdrasil size={620} />
      </div>

      {/* Runebånd topp */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around py-4 font-cinzel text-2xl text-viking-gold opacity-20" style={{ letterSpacing: '0.4em' }}>
        <span>ᚦ</span><span>ᚱ</span><span>ᚾ</span><span>ᛏ</span><span>ᛚ</span><span>ᛟ</span>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-14 sm:px-8">
        {/* Tittel */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-4">
            <ThorHammer size={48} color="#9C8138" />
            <h1 className="font-saga text-4xl viking-engraved-large sm:text-5xl">For lærere</h1>
            <ThorHammer size={48} color="#9C8138" />
          </div>
          <p className="mt-3 font-inter italic text-viking-gold-soft">
            Et klasseromsspill om vikingenes kulturmøter — gratis, ingen installasjon, fungerer i nettleseren.
          </p>
        </div>

        <RuneDivider className="mb-10" />

        {/* Lenke til appen */}
        <div className="viking-card mb-10 rounded-lg p-6 text-center">
          <p className="font-cinzel text-sm uppercase tracking-widest text-viking-gold-soft">Del denne lenken med klassen</p>
          <a
            href="https://vikingspill.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block font-saga text-3xl text-viking-gold underline decoration-viking-gold/40 underline-offset-4 transition hover:text-viking-gold-soft sm:text-4xl"
          >
            vikingspill.vercel.app
          </a>
          <p className="mt-3 font-inter text-sm text-viking-paper/80">
            Samme lenke for både lærer og elever — rolle velges når man åpner siden.
          </p>
        </div>

        {/* Sånn kommer dere i gang */}
        <section className="mb-10">
          <h2 className="mb-5 flex items-center gap-3 font-saga text-2xl text-viking-gold viking-engraved">
            <Vegvisir size={32} color="#9C8138" /> Slik kommer dere i gang
          </h2>
          <ol className="space-y-5">
            <Step
              num="1"
              title="Åpne lenken på din maskin (gjerne projektor)"
              body={<>Trykk <strong className="text-viking-gold">«Jeg er Tor ⚡»</strong>. Du blir spillets game master.</>}
            />
            <Step
              num="2"
              title="Opprett spillet"
              body={<>Trykk <strong className="text-viking-gold">«Åpne Åsgards porter»</strong>. Du får et runeord på fire bokstaver (f.eks. <code>RAVN</code>).</>}
            />
            <Step
              num="3"
              title="Del runeordet med klassen"
              body={<>Skriv koden på tavla eller del lenken. Elevene åpner siden på sin egen telefon eller iPad og velger <strong className="text-viking-gold">«Jeg er viking»</strong>.</>}
            />
            <Step
              num="4"
              title="Elevene lager grupper"
              body={<>Først inn i en gruppe blir <strong className="text-viking-gold">høvding</strong> og styrer skipet. De andre i samme gruppe taster samme runeord, finner skipet sitt og trykker «Bli med». Høvdingen velger; alle ser.</>}
            />
            <Step
              num="5"
              title="Spinn Skjebnehjulet når du vil ha drama"
              body={<>Underveis trykker du på <strong className="text-viking-gold">Skjebnehjulet</strong> for å sette i gang gudenes prøver, storm, Ragnarok eller andre hendelser. Du bestemmer kun <em>når</em> — Nornene styrer resten.</>}
            />
          </ol>
        </section>

        {/* Tips */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-3 font-saga text-2xl text-viking-gold viking-engraved">
            <Raven size={32} facing="right" color="#9C8138" /> Gode tips
          </h2>
          <ul className="space-y-3">
            <Tip icon="🖥" text={<>La din egen skjerm vises på <strong>projektor eller storskjerm</strong>. Det er der hele klassen ser kartet, leaderboardet og hjulet.</>} />
            <Tip icon="👥" text={<>Lag grupper på <strong>3–5 elever</strong>. Mindre grupper får dårlig diskusjon, større blir kaotiske.</>} />
            <Tip icon="⛵" text={<>Hver gruppe trenger <strong>én høvding</strong> som har rett til å trykke valgene. De andre er med på skjermen og hjelper å diskutere.</>} />
            <Tip icon="⏱" text={<>Tidsbruk: en kort time (~75 min) for 6–7 steder, en dobbeltime (~120 min) for full reise gjennom alle 12.</>} />
            <Tip icon="📜" text={<>Skru på «Krev begrunnelse» hvis du vil ha saga-loggen tilgjengelig for etterarbeid og vurdering. Innstillingene ligger oppe i panelet ditt.</>} />
            <Tip icon="📖" text={<>For yrkesfag eller klasser med varierende leseferdighet: bruk innstillingen <strong>Kortversjon</strong> for kortere tekster som beholder handlingen.</>} />
          </ul>
        </section>

        <KnotBorder width={520} height={22} className="mx-auto mb-10 opacity-70" />

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-3 font-saga text-lg font-bold text-viking-darkblue transition hover:bg-viking-gold-soft"
          >
            <ThorHammer size={28} color="#3a1f0d" />
            Til spillet
          </Link>
          <p className="mt-4 font-mono text-xs text-viking-gold-soft/60">
            Laget av T. Ulriksen · gratis å bruke i undervisning
          </p>
        </div>
      </div>

      {/* Runebånd bunn */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-around py-4 font-cinzel text-2xl text-viking-gold opacity-20" style={{ letterSpacing: '0.4em' }}>
        <span>ᚷ</span><span>ᚹ</span><span>ᛟ</span><span>ᛚ</span><span>ᛏ</span><span>ᚾ</span>
      </div>
    </div>
  );
}
