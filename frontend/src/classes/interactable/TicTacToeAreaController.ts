import {
  GameArea,
  GameStatus,
  TicTacToeGameState,
  TicTacToeGridPosition,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, { GameEventTypes } from './GameAreaController';

export const PLAYER_NOT_IN_GAME_ERROR = 'Player is not in game';

export const NO_GAME_IN_PROGRESS_ERROR = 'No game in progress';

export type TicTacToeCell = 'X' | 'O' | undefined;
export type TicTacToeEvents = GameEventTypes & {
  boardChanged: (board: TicTacToeCell[][]) => void;
  turnChanged: (isOurTurn: boolean) => void;
};

/**
 * This class is responsible for managing the state of the Tic Tac Toe game, and for sending commands to the server
 */
export default class TicTacToeAreaController extends GameAreaController<
  TicTacToeGameState,
  TicTacToeEvents
> {
  /**
   * Returns the current state of the board.
   *
   * The board is a 3x3 array of TicTacToeCell, which is either 'X', 'O', or undefined.
   *
   * The 2-dimensional array is indexed by row and then column, so board[0][0] is the top-left cell,
   * and board[2][2] is the bottom-right cell
   */
  get board(): TicTacToeCell[][] {
    return [[]]; //TODO
  }

  /**
   * Returns the player with the 'X' game piece, if there is one, or undefined otherwise
   */
  get x(): PlayerController | undefined {
    return undefined; //TODO
  }

  /**
   * Returns the player with the 'O' game piece, if there is one, or undefined otherwise
   */
  get o(): PlayerController | undefined {
    return undefined; //TODO
  }

  /**
   * Returns the number of moves that have been made in the game
   */
  get moveCount(): number {
    return 0; //TODO
  }

  /**
   * Returns the winner of the game, if there is one
   */
  get winner(): PlayerController | undefined {
    return undefined; //TODO
  }

  /**
   * Returns the player whose turn it is, if the game is in progress
   * Returns undefined if the game is not in progress
   */
  get whoseTurn(): PlayerController | undefined {
    return undefined; //TODO
  }

  /**
   * Returns true if it is our turn to make a move in the game
   * Returns false if it is not our turn, or if the game is not in progress
   */
  get isOurTurn(): boolean {
    return true; //TODO
  }

  /**
   * Returns true if the current player is a player in this game
   */
  get isPlayer(): boolean {
    return false; //TODO
  }

  /**
   * Returns the game piece of the current player, if the current player is a player in this game
   *
   * Throws an error PLAYER_NOT_IN_GAME_ERROR if the current player is not a player in this game
   */
  get gamePiece(): 'X' | 'O' {
    throw new Error(PLAYER_NOT_IN_GAME_ERROR); //TODO
  }

  /**
   * Returns the status of the game.
   * Defaults to 'WAITING_TO_START' if the game is not in progress
   */
  get status(): GameStatus {
    return 'WAITING_TO_START'; //TODO
  }

  /**
   * Returns true if the game is in progress
   */
  public isActive(): boolean {
    return false; //TODO
  }

  /**
   * Updates the internal state of this TicTacToeAreaController to match the new model.
   *
   * Calls super._updateFrom, which updates the occupants of this game area and
   * other common properties (including this._model).
   *
   * If the board has changed, emits a 'boardChanged' event with the new board. If the board has not changed,
   *  does not emit the event.
   *
   * If the turn has changed, emits a 'turnChanged' event with true if it is our turn, and false otherwise.
   * If the turn has not changed, does not emit the event.
   */
  protected _updateFrom(newModel: GameArea<TicTacToeGameState>): void {
    super._updateFrom(newModel);
    //TODO
  }

  /**
   * Sends a request to the server to make a move in the game.
   * Uses the this._townController.sendInteractableCommand method to send the request.
   * The request should be of type 'GameMove',
   * and send the gameID provided by `this._instanceID`.
   *
   * If the game is not in progress, throws an error NO_GAME_IN_PROGRESS_ERROR
   *
   * @param row Row of the move
   * @param col Column of the move
   */
  public async makeMove(row: TicTacToeGridPosition, col: TicTacToeGridPosition) {
    if (row || col) {
      //Delete this, it's just here to make the linter happy until you implement this method
      return;
    }
    return; //TODO
  }
}
