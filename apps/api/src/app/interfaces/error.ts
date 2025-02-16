export enum REQUEST_STATUS {
  // * 2xx Success
  created = 201,
  ok = 200,
  accepted = 202,
  // * 4xx Client Errors
  bad = 400,
  unauthorized = 401,
  forbidden = 403,
  not_found = 404,
  conflict = 409,
  too_large = 413,
  unsupported_media_type = 415,
  unprocessable_entity = 422,
  // * 5xx Server Errors
  internal = 500,
  not_implemented = 501,
}

export type Exception = {
  readonly statusCode: REQUEST_STATUS;
  readonly message: string;
};
