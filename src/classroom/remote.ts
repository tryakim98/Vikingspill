export type Remote = Awaited<
  ReturnType<(typeof import("./firebaseClient"))["getRemote"]>
>;
let pending: Promise<Remote> | undefined;
/** Solo and the home page load without initializing or downloading Firebase. */
export async function getRemote(): Promise<Remote> {
  pending ??= import("./firebaseClient")
    .then((module) => module.getRemote())
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}
