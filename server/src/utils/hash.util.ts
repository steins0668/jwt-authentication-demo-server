import crypto from "crypto";

export namespace HashUtil {
  export function byCrypto(raw: string) {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}
