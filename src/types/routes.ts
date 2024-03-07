import { type RawReplyDefaultExpression, type RawRequestDefaultExpression, type RawServerDefault, type RouteHandlerMethod } from 'fastify';

export type RouteHandlerWithBody<Body, Reply> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  { Reply: Reply; Body: Body }
>;

export type RouteHandler<Reply> = RouteHandlerMethod<RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, { Reply: Reply }>;

export type RouterHandlerWithParams<Params, Reply> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  { Params: Params; Reply: Reply }
>;

export type RouteHandlerWithBodyAndParams<Params, Body, Reply> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  { Params: Params; Body: Body; Reply: Reply }
>;

export type RouteHandlerWithQueryString<QueryString, Reply> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  { Reply: Reply; Querystring: QueryString }
>;

export type RouteHandlerWithQueryAndParamsString<Params, QueryString, Reply> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  { Params: Params; Querystring: QueryString; Reply: Reply }
>;

export interface ErrorResponse {
  error: string;
}

export type PossibleErrorResponse<T = unknown> = T | ErrorResponse;
