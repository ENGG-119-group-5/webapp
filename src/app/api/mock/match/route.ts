import { mockMatch } from "@/lib/mock/match";
import { ValidationError } from "@/lib/mock/db";
import { handle } from "@/lib/mock/http";

/** Mock version of the backend's POST /match: accepts any PDF and returns a fixed sample result. */
export async function POST(req: Request) {
  return handle(async () => {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new ValidationError("Upload a PDF in the `file` field.");
    await new Promise((r) => setTimeout(r, 400)); // let the loading state show
    return mockMatch(file.name);
  });
}
