import assert from 'assert';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import {
  GameArea,
  GameResult,
  GameStatus,
  TicTacToeGameState,
  TicTacToeGridPosition,
  TicTacToeMove,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import GameAreaController from './GameAreaController';
import TicTacToeAreaController, { NO_GAME_IN_PROGRESS_ERROR } from './TicTacToeAreaController';

describe('[T1] TicTacToeAreaController', () => {
  const ourPlayer = new PlayerController(nanoid(), nanoid(), {
    x: 0,
    y: 0,
    moving: false,
    rotation: 'front',
  });
  const otherPlayers = [
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
  ];

  const mockTownController = mock<TownController>();
  Object.defineProperty(mockTownController, 'ourPlayer', {
    get: () => ourPlayer,
  });
  Object.defineProperty(mockTownController, 'players', {
    get: () => [ourPlayer, ...otherPlayers],
  });
  mockTownController.getPlayer.mockImplementation(playerID => {
    const p = mockTownController.players.find(player => player.id === playerID);
    assert(p);
    return p;
  });

  function ticTacToeAreaControllerWithProp({
    _id,
    history,
    x,
    o,
    undefinedGame,
    status,
    moves,
    winner,
  }: {
    _id?: string;
    history?: GameResult[];
    x?: string;
    o?: string;
    undefinedGame?: boolean;
    status?: GameStatus;
    moves?: TicTacToeMove[];
    winner?: string;
  }) {
    const id = _id || nanoid();
    const players = [];
    if (x) players.push(x);
    if (o) players.push(o);
    const ret = new TicTacToeAreaController(
      id,
      {
        id,
        occupants: players,
        history: history || [],
        type: 'TicTacToeArea',
        game: undefinedGame
          ? undefined
          : {
              id,
              players: players,
              state: {
                status: status || 'IN_PROGRESS',
                x: x,
                o: o,
                moves: moves || [],
                winner: winner,
              },
            },
      },
      mockTownController,
    );
    if (players) {
      ret.occupants = players
        .map(eachID => mockTownController.players.find(eachPlayer => eachPlayer.id === eachID))
        .filter(eachPlayer => eachPlayer) as PlayerController[];
    }
    return ret;
  }
  describe('[T1.1]', () => {
    describe('isActive', () => {
      it('should return true if the game is in progress', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        expect(controller.isActive()).toBe(true);
      });
      it('should return false if the game is not in progress', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'OVER',
        });
        expect(controller.isActive()).toBe(false);
      });
    });
    describe('isPlayer', () => {
      it('should return true if the current player is a player in this game', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
        });
        expect(controller.isPlayer).toBe(true);
      });
      it('should return false if the current player is not a player in this game', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: otherPlayers[0].id,
          o: otherPlayers[1].id,
        });
        expect(controller.isPlayer).toBe(false);
      });
    });
    describe('gamePiece', () => {
      it('should return the game piece of the current player if the current player is a player in this game', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
        });
        expect(controller.gamePiece).toBe('X');

        //check O
        const controller2 = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          o: ourPlayer.id,
        });
        expect(controller2.gamePiece).toBe('O');
      });
      it('should throw an error if the current player is not a player in this game', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: otherPlayers[0].id,
          o: otherPlayers[1].id,
        });
        expect(() => controller.gamePiece).toThrowError();
      });
    });
    describe('status', () => {
      it('should return the status of the game', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        expect(controller.status).toBe('IN_PROGRESS');
      });
      it('should return WAITING_TO_START if the game is not defined', () => {
        const controller = ticTacToeAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.status).toBe('WAITING_TO_START');
      });
    });
    describe('whoseTurn', () => {
      it('should return the player whose turn it is initially', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
        expect(controller.whoseTurn).toBe(ourPlayer);
      });
      it('should return the player whose turn it is after a move', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
          moves: [
            {
              gamePiece: 'X',
              row: 0,
              col: 0,
            },
          ],
        });
        expect(controller.whoseTurn).toBe(otherPlayers[0]);
      });
      it('should return undefined if the game is not in progress', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'OVER',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
        expect(controller.whoseTurn).toBe(undefined);
      });
    });
    describe('isOurTurn', () => {
      it('should return true if it is our turn', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
        expect(controller.isOurTurn).toBe(true);
      });
      it('should return false if it is not our turn', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: otherPlayers[0].id,
          o: ourPlayer.id,
        });
        expect(controller.isOurTurn).toBe(false);
      });
    });
    describe('moveCount', () => {
      it('should return the number of moves that have been made', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
          moves: [
            {
              gamePiece: 'X',
              row: 0,
              col: 0,
            },
          ],
        });
        expect(controller.moveCount).toBe(1);
      });
    });
    describe('board', () => {
      it('should return an empty board by default', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
        expect(controller.board).toEqual([
          [undefined, undefined, undefined],
          [undefined, undefined, undefined],
          [undefined, undefined, undefined],
        ]);
      });
    });
    describe('x', () => {
      it('should return the x player if there is one', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
        expect(controller.x).toBe(ourPlayer);
      });
      it('should return undefined if there is no x player and the game is waiting to start', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.x).toBe(undefined);
      });
      it('should return undefined if there is no x player', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          o: otherPlayers[0].id,
        });
        expect(controller.x).toBe(undefined);
      });
    });
    describe('o', () => {
      it('should return the o player if there is one', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: otherPlayers[0].id,
          o: ourPlayer.id,
        });
        expect(controller.o).toBe(ourPlayer);
      });
      it('should return undefined if there is no o player and the game is waiting to start', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.o).toBe(undefined);
      });
      it('should return undefined if there is no o player', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: otherPlayers[0].id,
        });
        expect(controller.o).toBe(undefined);
      });
    });
    describe('winner', () => {
      it('should return the winner if there is one', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'OVER',
          x: otherPlayers[0].id,
          o: ourPlayer.id,
          winner: ourPlayer.id,
        });
        expect(controller.winner).toBe(ourPlayer);
      });
      it('should return undefined if there is no winner', () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'OVER',
          x: otherPlayers[0].id,
          o: ourPlayer.id,
        });
        expect(controller.winner).toBe(undefined);
      });
    });
    describe('makeMove', () => {
      it('Should throw an error if the game is not in progress (Over)', async () => {
        //TODO
        //Hint: Use mockTownController
        const controller = ticTacToeAreaControllerWithProp({
          status: 'OVER',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
        await expect(
          controller.makeMove(0 as TicTacToeGridPosition, 0 as TicTacToeGridPosition),
        ).rejects.toThrow(NO_GAME_IN_PROGRESS_ERROR);
      });
      it('Should throw an error if the game is not in progress (Waiting to start)', async () => {
        //TODO
        //Hint: Use mockTownController
        const controller = ticTacToeAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        await expect(
          controller.makeMove(0 as TicTacToeGridPosition, 0 as TicTacToeGridPosition),
        ).rejects.toThrow(NO_GAME_IN_PROGRESS_ERROR);
      });
      it('Should throw an error if the game is no gameInstanceID', async () => {
        //TODO
        //Hint: Use mockTownController
        const controller = ticTacToeAreaControllerWithProp({});
        await expect(
          controller.makeMove(0 as TicTacToeGridPosition, 0 as TicTacToeGridPosition),
        ).rejects.toThrow(NO_GAME_IN_PROGRESS_ERROR);
      });
      it('should throw an error if there is no one joinGame and makeMove', async () => {
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });

        await expect(
          controller.makeMove(0 as TicTacToeGridPosition, 0 as TicTacToeGridPosition),
        ).rejects.toThrowError(NO_GAME_IN_PROGRESS_ERROR);
      });
      it('Should call townController.sendInteractableCommand', async () => {
        // Instantiate the TicTacToeAreaController with the mock game instance ID
        const controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });

        const mockId = nanoid();
        // Make a move

        mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
          return { gameID: mockId };
        });
        await controller.joinGame();
        await controller.makeMove(0 as TicTacToeGridPosition, 0 as TicTacToeGridPosition);
        // Expect the sendInteractableCommand method of mockTownController to have been called
        expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
          type: 'GameMove',
          gameID: mockId,
          move: {
            gamePiece: 'X', // Assuming ourPlayer is X
            row: 0,
            col: 0,
          },
        });
      });
    });
  });
  describe('[T1.2] _updateFrom', () => {
    describe('if the game is in progress', () => {
      let controller: TicTacToeAreaController;
      beforeEach(() => {
        controller = ticTacToeAreaControllerWithProp({
          status: 'IN_PROGRESS',
          x: ourPlayer.id,
          o: otherPlayers[0].id,
        });
      });
      it('should emit a boardChanged event with the new board', () => {
        const emitSpy = jest.spyOn(controller, 'emit');

        const currentModel = controller.toInteractableAreaModel();
        assert(currentModel.game);

        const newMoves: ReadonlyArray<TicTacToeMove> = [
          {
            gamePiece: 'X',
            row: 0 as TicTacToeGridPosition,
            col: 1 as TicTacToeGridPosition,
          },
        ];

        const updateModel: GameArea<TicTacToeGameState> = {
          ...currentModel,
          game: {
            ...currentModel.game,
            state: {
              ...currentModel.game.state,
              moves: newMoves,
            },
          },
        };

        controller.updateFrom(updateModel, otherPlayers.concat(ourPlayer));

        const updatedBoard = [
          [undefined, 'X', undefined],
          [undefined, undefined, undefined],
          [undefined, undefined, undefined],
        ];

        expect(emitSpy).toHaveBeenCalledWith('boardChanged', updatedBoard);
        //TODO
        //Hint: Set up a spy on the `emit` method of the controller
      });

      it('should emit a turnChanged event with true if it is our turn', () => {
        const spy = jest.spyOn(controller, 'emit');
        const model = controller.toInteractableAreaModel();
        console.log(controller.whoseTurn?.id);
        const newMoves: ReadonlyArray<TicTacToeMove> = [
          {
            gamePiece: 'X',
            row: 0 as TicTacToeGridPosition,
            col: 0 as TicTacToeGridPosition,
          },
        ];
        assert(model.game);
        const newModel: GameArea<TicTacToeGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        controller.updateFrom(newModel, controller.occupants);
        console.log(controller.whoseTurn?.id);
        // console.log(spy.mock.calls);
        const turnChangedCallOne = spy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCallOne).toBeDefined();
        expect(spy).toHaveBeenCalledWith('turnChanged', false);
        const newMovesOne: ReadonlyArray<TicTacToeMove> = [
          {
            gamePiece: 'X',
            row: 0 as TicTacToeGridPosition,
            col: 0 as TicTacToeGridPosition,
          },
          {
            gamePiece: 'O',
            row: 1 as TicTacToeGridPosition,
            col: 2 as TicTacToeGridPosition,
          },
        ];
        assert(newModel.game);
        const newModelOne: GameArea<TicTacToeGameState> = {
          ...newModel,
          game: {
            ...newModel.game,
            state: {
              ...newModel.game?.state,
              moves: newMovesOne,
            },
          },
        };

        controller.updateFrom(newModelOne, controller.occupants);
        const turnChangedCall = spy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).toBeDefined();
        expect(spy).toHaveBeenCalledWith('turnChanged', true);
      });

      it('should not emit a boardChanged event if the board has not changed', () => {});

      it('should emit a turnChanged event with false if it is not our turn', () => {
        const emitSpy = jest.spyOn(controller, 'emit');

        const model = controller.toInteractableAreaModel();
        const newMoves: ReadonlyArray<TicTacToeMove> = [
          {
            gamePiece: 'X',
            row: 0 as TicTacToeGridPosition,
            col: 0 as TicTacToeGridPosition,
          },
        ];

        assert(model.game);
        const newModel: GameArea<TicTacToeGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };

        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));

        expect(emitSpy).toHaveBeenCalledWith('turnChanged', false);
        //TODO
        //Hint: Set up a spy on the `emit` method of the controller
      });
      it('should not emit a turnChanged event if the turn has not changed', () => {
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(controller.toInteractableAreaModel(), otherPlayers.concat(ourPlayer));
        expect(emitSpy).not.toHaveBeenCalledWith('turnChanged', expect.anything());
        //TODO
        //Hint: Set up a spy on the `emit` method of the controller
      });
      it('should update the board returned by the board property', () => {
        const model = controller.toInteractableAreaModel();
        const newMoves: ReadonlyArray<TicTacToeMove> = [
          {
            gamePiece: 'X',
            row: 0 as TicTacToeGridPosition,
            col: 0 as TicTacToeGridPosition,
          },
          {
            gamePiece: 'O',
            row: 1 as TicTacToeGridPosition,
            col: 1 as TicTacToeGridPosition,
          },
        ];
        assert(model.game);
        const newModel: GameArea<TicTacToeGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        expect(controller.board).toEqual([
          ['X', undefined, undefined],
          [undefined, 'O', undefined],
          [undefined, undefined, undefined],
        ]);
      });
    });
    it('should call super._updateFrom', () => {
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore - we are testing spying on a private method
      const spy = jest.spyOn(GameAreaController.prototype, '_updateFrom');
      const controller = ticTacToeAreaControllerWithProp({});
      const model = controller.toInteractableAreaModel();
      controller.updateFrom(model, otherPlayers.concat(ourPlayer));
      expect(spy).toHaveBeenCalled();
    });
  });
});
