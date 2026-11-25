import { content } from "../../content";
export const harbourName = (id: string) =>
  id === "sameland"
    ? "Sápmi"
    : content.ports.find((p) => p.port.id === id)!.port.name;
