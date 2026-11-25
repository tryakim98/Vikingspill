import { useMemo } from "react";
import qrcode from "qrcode-generator";
import { Shell } from "../ui";

export default function ClassBoard({ code }: { code: string }) {
  const join = new URL("/balder", window.location.origin);
  join.searchParams.set("kode", code);
  const href = join.href;
  const qrImage = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(href);
    qr.make();
    // Four modules of clear space on all sides allow a phone to read the board.
    return qr.createDataURL(8, 32);
  }, [href]);
  return (
    <Shell className="bd bd-board" title="Bli med i Balder">
      <section className="bd-board-pass">
        <div>
          <h2>Klassekoden</h2>
          <strong className="bd-code">{code}</strong>
          <p>
            Åpne <a href={href}>{location.host}/balder</a> og tast koden, eller
            skann med mobilen.
          </p>
        </div>
        <a
          className="bd-qr"
          href={href}
          aria-label="Åpne Balder med klassekoden ferdig utfylt"
        >
          <img
            src={qrImage}
            alt="QR-kode til Balder med klassens spillkode"
            width={248}
            height={248}
          />
        </a>
      </section>
      <p className="bd-board-instructions">
        Én i gruppa oppretter skipet. Resten velger samme skipsnavn.
      </p>
    </Shell>
  );
}
