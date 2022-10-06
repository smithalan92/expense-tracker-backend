import { RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteHandlerMethod } from 'fastify';

export type RouteHandler<Body, Reply> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  { Reply: Reply; Body: Body }
>;

export interface ErrorResponse {
  error: string;
}

export type PossibleErrorResponse<T> = T | ErrorResponse;
