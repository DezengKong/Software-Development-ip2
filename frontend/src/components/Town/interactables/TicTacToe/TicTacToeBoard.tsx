import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import TicTacToeAreaController, {
  TicTacToeCell,
} from '../../../../classes/interactable/TicTacToeAreaController';

export type TicTacToeGameProps = {
  gameAreaController: TicTacToeAreaController;
};

/**
 * A component that will render a single cell in the TicTacToe board, styled
 */
const StyledTicTacToeSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flexBasis: '33%',
    border: '1px solid black',
    height: '33%',
    fontSize: '50px',
    _disabled: {
      opacity: '100%',
    },
  },
});
/**
 * A component that will render the TicTacToe board, styled
 */
const StyledTicTacToeBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    width: '400px',
    height: '400px',
    padding: '5px',
    flexWrap: 'wrap',
  },
});

/**
 * A component that renders the TicTacToe board
 *
 * Renders the TicTacToe board as a "StyledTicTacToeBoard", which consists of 9 "StyledTicTacToeSquare"s
 * (one for each cell in the board, starting from the top left and going left to right, top to bottom).
 * Each StyledTicTacToeSquare has an aria-label property that describes the cell's position in the board,
 * formatted as `Cell ${rowIndex},${colIndex}`.
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, then each StyledTicTacToeSquare is clickable, and clicking
 * on it will make a move in that cell. If there is an error making the move, then a toast will be
 * displayed with the error message as the description of the toast. If it is not the current player's
 * turn, then the StyledTicTacToeSquare will be disabled.
 *
 * @param gameAreaController the controller for the TicTacToe game
 */
export default function TicTacToeBoard({ gameAreaController }: TicTacToeGameProps): JSX.Element {
  const [board, setBoard] = useState<TicTacToeCell[][]>(gameAreaController.board); // Initialize with the current board
  const [isOurTurn, setIsOurTurn] = useState<boolean>(gameAreaController.isOurTurn);
  const toast = useToast();

  useEffect(() => {
    const handleBoardUpdate = () => {
      setBoard(gameAreaController.board);
    };

    const handleTurnUpdate = () => {
      setIsOurTurn(gameAreaController.isOurTurn);
    };

    gameAreaController.addListener('boardChanged', handleBoardUpdate);
    gameAreaController.addListener('turnChanged', handleTurnUpdate);
    return () => {
      gameAreaController.removeListener('boardChanged', handleBoardUpdate);
      gameAreaController.removeListener('turnChanged', handleTurnUpdate);
    };
  }, [gameAreaController]);

  const handleCellClick = async (row: 0 | 1 | 2, col: 0 | 1 | 2) => {
    try {
      await gameAreaController.makeMove(row, col);
    } catch (e) {
      toast({
        description: 'Error: ' + (e instanceof Error ? e.message : String(e)),
        status: 'error',
      });
    }
  };

  return (
    <StyledTicTacToeBoard aria-label='Tic-Tac-Toe Board'>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <StyledTicTacToeSquare
            key={`${rowIndex}-${colIndex}`}
            aria-label={`Cell ${rowIndex},${colIndex}`}
            onClick={() => handleCellClick(rowIndex as 0 | 1 | 2, colIndex as 0 | 1 | 2)}
            disabled={!isOurTurn}>
            {cell}
          </StyledTicTacToeSquare>
        )),
      )}
    </StyledTicTacToeBoard>
  );
}
