import localStorage from "./localReportStorage.js";

export const storage = Object.freeze({
  async write(input) {
    return localStorage.writeLocalArtifact(input);
  },

  async read(storageKey) {
    return localStorage.readLocalArtifact(storageKey);
  },

  async remove(storageKey) {
    return localStorage.removeLocalArtifact(storageKey);
  },
});

export default storage;
