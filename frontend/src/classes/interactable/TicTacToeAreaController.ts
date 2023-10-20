import {
  GameArea,
  GameMoveCommand,
  GameStatus,
  TicTacToeGameState,
  TicTacToeGridPosition,
  TicTacToeMove,
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
    const board: TicTacToeCell[][] = [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ];
    const moves = this._model.game?.state.moves || [];
    for (let i = 0; i < moves.length; i++) {
      const currMove = moves[i];
      board[currMove?.row][currMove?.col] = currMove?.gamePiece;
    }
    return board;
  }

  /**
   * Returns the player with the 'X' game piece, if there is one, or undefined otherwise
   */
  get x(): PlayerController | undefined {
    return this.players.find(player => this._model.game?.state.x === player.id);
  }

  /**
   * Returns the player with the 'O' game piece, if there is one, or undefined otherwise
   */
  get o(): PlayerController | undefined {
    return this.players.find(player => this._model.game?.state.o === player.id);
  }

  /**
   * Returns the number of moves that have been made in the game
   */
  get moveCount(): number {
    const moves = this._model.game?.state.moves || [];
    return moves.length;
  }

  /**
   * Returns the winner of the game, if there is one
   */
  get winner(): PlayerController | undefined {
    const players = this.players;
    return players.find(player => this._model.game?.state.winner === player.id);
  }

  /**
   * Returns the player whose turn it is, if the game is in progress
   * Returns undefined if the game is not in progress
   */
  get whoseTurn(): PlayerController | undefined {
    const gameState = this._model.game?.state;
    const players = this.players;
    if (gameState && gameState.status === 'IN_PROGRESS') {
      for (const player of players) {
        if (this.moveCount % 2 === 0 && gameState.x && player.id === gameState.x) {
          return player;
        } else if (this.moveCount % 2 !== 0 && gameState.o && player.id === gameState.o) {
          return player;
        }
      }
    }
    return undefined;
  }

  /**
   * Returns true if it is our turn to make a move in the game
   * Returns false if it is not our turn, or if the game is not in progress
   */
  get isOurTurn(): boolean {
    const gameState = this._model.game?.state;
    if (!gameState || gameState.status !== 'IN_PROGRESS') {
      return false;
    }
    return this._townController.ourPlayer === this.whoseTurn;
  }

  /**
   * Returns true if the current player is a player in this game
   */
  get isPlayer(): boolean {
    const currentPlayer = this._townController.ourPlayer;
    return this.players.some(player => player.id === currentPlayer.id);
  }

  /**
   * Returns the game piece of the current player, if the current player is a player in this game
   *
   * Throws an error PLAYER_NOT_IN_GAME_ERROR if the current player is not a player in this game
   */
  get gamePiece(): 'X' | 'O' {
    if (!this.isPlayer) {
      throw new Error(PLAYER_NOT_IN_GAME_ERROR); //TODO
    }
    const currentPlayer = this._townController.ourPlayer;
    return currentPlayer === this.x ? 'X' : 'O';
  }

  /**
   * Returns the status of the game.
   * Defaults to 'WAITING_TO_START' if the game is not in progress
   */
  get status(): GameStatus {
    return this._model.game?.state.status || 'WAITING_TO_START';
  }

  /**
   * Returns true if the game is in progress
   */
  public isActive(): boolean {
    return this.status === 'IN_PROGRESS' ? true : false;
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
    const oldBoard = this.board;
    const oldIsOurTurn = this.isOurTurn;
    // Call the super method to update common properties and the internal model
    super._updateFrom(newModel);
    // Check if the board has changed
    const hasBoardChanged = !this._areBoardEqual(oldBoard, this.board);
    if (hasBoardChanged) {
      this.emit('boardChanged', this.board);
    }
    // Check if the turn has changed
    if (oldIsOurTurn !== this.isOurTurn) {
      this.emit('turnChanged', this.isOurTurn);
    }
  }

  /**
   * Compares two TicTacToe boards to determine if they are equal.
   *
   * This method performs a cell-by-cell comparison of two boards.
   * It returns true if all corresponding cells of the two boards have the same value ('X', 'O', or undefined),
   * and returns false otherwise.
   *
   * @param board1 - The first board to compare.
   * @param board2 - The second board to compare.
   * @returns true if the boards are equal, false otherwise.
   */
  private _areBoardEqual(board1: TicTacToeCell[][], board2: TicTacToeCell[][]): boolean {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board1[i][j] !== board2[i][j]) {
          return false;
        }
      }
    }
    return true;
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
    if (!this.isActive) {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }

    if (!this._instanceID) {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }

    const gameMoveRequest: GameMoveCommand<TicTacToeMove> = {
      type: 'GameMove',
      gameID: this._instanceID,
      move: {
        gamePiece: this.gamePiece,
        row: row,
        col: col,
      },
    };

    await this._townController.sendInteractableCommand(this.id, gameMoveRequest);
  }
}
