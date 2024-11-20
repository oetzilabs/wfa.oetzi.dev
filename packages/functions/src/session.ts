import { Organizations } from "@wfa/core/src/entities/organizations";
import { Companies } from "@wfa/core/src/entities/companies";
import { StatusCodes } from "http-status-codes";
import { ApiHandler, error, getUser, json } from "./utils";

export const handler = ApiHandler(async (_event) => {
  const authtoken = _event.headers["Authorization"] || _event.headers["authorization"];
  if (!authtoken) {
    return error("No Authorization header", StatusCodes.UNAUTHORIZED);
  }
  const user = await getUser(authtoken.split(" ")[1]);

  if (!user) {
    return error("User not found", StatusCodes.NOT_FOUND);
  }

  const org = await Organizations.lastCreatedByUserId(user.id);
  const company = await Companies.lastCreatedByUserId(user.id);

  return json({
    email: user.email,
    id: user.id,
    organization_id: org?.id ?? null,
    company_id: company?.id ?? null,
  });
});
