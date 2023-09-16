import { FastifyInstance } from 'fastify';
import TripController from '../controllers/TripController';
import {
  AddExpenseForTripBody,
  AddExpenseForTripParams,
  CreateTripBody,
  CreateTripResponse,
  DeleteExpenseParams,
  DeleteTripParams,
  EditExpenseForTripParams,
  GetExpenseStatsResponse,
  GetExpensesForTripReponse,
  GetTripDataForEditingResponse,
  GetTripDataResponse,
  GetTripReponse,
  RouteWithTripIDParams,
  UpdateExpenseForTripBody,
  UpdateTripBody,
  UpdateTripResponse,
} from '../controllers/TripController.types';
import { ContainerCradle, Router } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

class TripRoutes implements Router {
  controller: TripController;

  constructor({ tripController }: ContainerCradle) {
    this.controller = tripController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetTripReponse>;
    }>({
      method: 'GET',
      url: '/trips',
      handler: this.controller.getTrips,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetExpensesForTripReponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/expenses',
      handler: this.controller.getExpensesForTrip,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetTripDataResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/data',
      handler: this.controller.getTripData,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetTripDataForEditingResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/edit-data',
      handler: this.controller.getTripDataForEditing,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetExpenseStatsResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/stats',
      handler: this.controller.getExpenseStats,
    });

    server.route<{
      Params: AddExpenseForTripParams;
      Body: AddExpenseForTripBody;
      Reply: PossibleErrorResponse;
    }>({
      method: 'POST',
      url: '/trips/:tripId/expense',
      handler: this.controller.addExpenseForTrip,
    });

    server.route<{
      Params: DeleteExpenseParams;
      Reply: PossibleErrorResponse<any>;
    }>({
      method: 'DELETE',
      url: '/trips/:tripId/expense/:expenseId',
      handler: this.controller.deleteExpense,
    });

    server.route<{
      Params: EditExpenseForTripParams;
      Body: UpdateExpenseForTripBody;
      Reply: PossibleErrorResponse;
    }>({
      method: 'PATCH',
      url: '/trips/:tripId/expense/:expenseId',
      handler: this.controller.updateExpenseForTrip,
    });

    server.route<{
      Body: CreateTripBody;
      Reply: PossibleErrorResponse<CreateTripResponse>;
    }>({
      method: 'POST',
      url: '/trips',
      handler: this.controller.createTrip,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Body: UpdateTripBody;
      Reply: PossibleErrorResponse<UpdateTripResponse>;
    }>({
      method: 'PATCH',
      url: '/trips/:tripId',
      handler: this.controller.updateTrip,
    });

    server.route<{
      Params: DeleteTripParams;
      Reply: PossibleErrorResponse;
    }>({
      method: 'DELETE',
      url: '/trips/:tripId',
      handler: this.controller.deleteTrip,
    });
  }
}

export default TripRoutes;
