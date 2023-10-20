import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import TicTacToeAreaController, {
  TicTacToeCell,
} from '../../../../classes/interactable/TicTacToeAreaController';
import { TicTacToeGridPosition } from '../../../../types/CoveyTownSocket';

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
  const toast = useToast();
  const [gameBoard, setGameBoard] = useState<TicTacToeCell[][]>(gameAreaController.board);
  const [gameIsOurTurn, setGameIsOurTurn] = useState<boolean>(gameAreaController.isOurTurn);

  useEffect(() => {
    const boardChangeListener = () => {
      setGameBoard(gameAreaController.board);
      setGameIsOurTurn(gameAreaController.isOurTurn);
    };

    const turnChangeListener = () => {
      setGameBoard(gameAreaController.board);
      setGameIsOurTurn(gameAreaController.isOurTurn);
    };

    gameAreaController.addListener('boardChanged', boardChangeListener);
    gameAreaController.addListener('turnChanged', turnChangeListener);

    return () => {
      // Clean up the listeners when the component unmounts
      gameAreaController.removeListener('boardChanged', boardChangeListener);
      gameAreaController.removeListener('turnChanged', turnChangeListener);
    };
  }, [gameAreaController]);

  // Function to handle a square click
  const handleSquareClick = async (row: TicTacToeGridPosition, col: TicTacToeGridPosition) => {
    try {
      // Call a function in your gameAreaController to make a move
      await gameAreaController.makeMove(row, col);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      toast({
        description: 'Error: ' + errorMessage,
        status: 'error',
      });
    }
  };

  const board = gameBoard.map((row, rowIndex) => (
    <div key={rowIndex}>
      {row.map((cell, colIndex) => (
        <StyledTicTacToeSquare
          key={colIndex}
          aria-label={`Cell ${rowIndex},${colIndex}`}
          onClick={() =>
            handleSquareClick(rowIndex as TicTacToeGridPosition, colIndex as TicTacToeGridPosition)
          }
          disabled={!gameIsOurTurn} // Disable squares if it's not our turn
        >
          {cell}
        </StyledTicTacToeSquare>
      ))}
    </div>
  ));

  return (
    <StyledTicTacToeBoard aria-label='Tic-Tac-Toe Board' disabled={!gameIsOurTurn}>
      {board}
    </StyledTicTacToeBoard>
  );
}