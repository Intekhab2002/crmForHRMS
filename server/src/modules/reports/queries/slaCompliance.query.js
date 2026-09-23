import { listRuns } from "./reportRun.query.js";

export async function fetchComplianceDataset(input, tx = null) {
  return listRuns(input, tx);
}

export default Object.freeze({ fetchComplianceDataset });
