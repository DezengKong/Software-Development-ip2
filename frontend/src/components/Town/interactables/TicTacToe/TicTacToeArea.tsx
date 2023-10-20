import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
  Button,
} from '@chakra-ui/react';
import React, { useCallback, useState, useEffect } from 'react';
import TicTacToeAreaController from '../../../../classes/interactable/TicTacToeAreaController';
import PlayerController from '../../../../classes/PlayerController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameResult, GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import Leaderboard from '../Leaderboard';
import TicTacToeBoard from './TicTacToeBoard';
/**
 * The TicTacToeArea component renders the TicTacToe game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It uses Chakra-UI components (does not use other GUI widgets)
 *
 * It uses the TicTacToeAreaController to get the current state of the game.
 * It listens for the 'gameUpdated' and 'gameEnd' events on the controller, and re-renders accordingly.
 * It subscribes to these events when the component mounts, and unsubscribes when the component unmounts. It also unsubscribes when the gameAreaController changes.
 *
 * It renders the following:
 * - A leaderboard (@see Leaderboard.tsx), which is passed the game history as a prop
 * - A list of observers' usernames (in a list with the aria-label 'list of observers in the game', one username per-listitem)
 * - A list of players' usernames (in a list with the aria-label 'list of players in the game', one item for X and one for O)
 *    - If there is no player in the game, the username is '(No player yet!)'
 *    - List the players as (exactly) `X: ${username}` and `O: ${username}`
 * - A message indicating the current game status:
 *    - If the game is in progress, the message is 'Game in progress, {moveCount} moves in, currently {whoseTurn}'s turn'. If it is currently our player's turn, the message is 'Game in progress, {moveCount} moves in, currently your turn'
 *    - Otherwise the message is 'Game {not yet started | over}.'
 * - If the game is in status WAITING_TO_START or OVER, a button to join the game is displayed, with the text 'Join New Game'
 *    - Clicking the button calls the joinGame method on the gameAreaController
 *    - Before calling joinGame method, the button is disabled and has the property isLoading set to true, and is re-enabled when the method call completes
 *    - If the method call fails, a toast is displayed with the error message as the description of the toast (and status 'error')
 *    - Once the player joins the game, the button dissapears
 * - The TicTacToeBoard component, which is passed the current gameAreaController as a prop (@see TicTacToeBoard.tsx)
 *
 * - When the game ends, a toast is displayed with the result of the game:
 *    - Tie: description 'Game ended in a tie'
 *    - Our player won: description 'You won!'
 *    - Our player lost: description 'You lost :('
 *
 */
function TicTacToeArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<TicTacToeAreaController>(interactableID);
  const toast = useToast();

  const [history, setHistory] = useState<GameResult[]>(gameAreaController.history);
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);
  const [xPlayer, setXPlayer] = useState<PlayerController | undefined>(gameAreaController.x);
  const [oPlayer, setOPlayer] = useState<PlayerController | undefined>(gameAreaController.o);
  const [moveCount, setMoveCount] = useState<number>(gameAreaController.moveCount);
  const [winner, setWinner] = useState<PlayerController | undefined>(gameAreaController.winner);
  const [whoseTurn, setWhoseTurn] = useState<PlayerController | undefined>(
    gameAreaController.whoseTurn,
  );
  const [isPlayer, setIsPlayer] = useState<boolean>(gameAreaController.isPlayer);
  const [status, setStatus] = useState<GameStatus>(gameAreaController.status);
  const townController = useTownController();
  const ourPlayer = townController.ourPlayer;
  const [loading, setLoading] = useState(false);

  const handleJoinGame = async () => {
    setLoading(true);
    try {
      await gameAreaController.joinGame();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: `Error: ${error.message}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false); // Ensure the loading state is reset whether or not there was an error.
    }
  };

  useEffect(() => {
    const handleGameUpdate = () => {
      setHistory(gameAreaController.history);
      setObservers(gameAreaController.observers);
      setXPlayer(gameAreaController.x);
      setOPlayer(gameAreaController.o);
      setMoveCount(gameAreaController.moveCount);
      setWhoseTurn(gameAreaController.whoseTurn);
      setIsPlayer(gameAreaController.isPlayer);
      setStatus(gameAreaController.status);
      setWinner(gameAreaController.winner);
    };

    const handleGameEnd = () => {
      if (winner == undefined) {
        toast({ description: 'Game ended in a tie' });
      } else if (winner === ourPlayer) {
        toast({ description: 'You won!' });
      } else if (winner !== ourPlayer) {
        toast({ description: 'You lost :(' });
      }
    };

    gameAreaController.addListener('gameUpdated', handleGameUpdate);
    gameAreaController.addListener('gameEnd', handleGameEnd);
    return () => {
      gameAreaController.removeListener('gameUpdated', handleGameUpdate);
      gameAreaController.removeListener('gameEnd', handleGameEnd);
    };
  }, [gameAreaController, toast, winner, ourPlayer]);

  const currentTurnMessage = () => {
    if (status !== 'IN_PROGRESS') {
      return `Game ${status === 'WAITING_TO_START' ? 'not yet started' : 'over'}.`;
    }
    if (whoseTurn === townController.ourPlayer) {
      return `Game in progress, ${moveCount} moves in, currently your turn`;
    }
    return `Game in progress, ${moveCount} moves in, currently ${whoseTurn?.userName}'s turn`;
  };

  return (
    <div>
      <Leaderboard results={history} />
      <ul aria-label='list of observers in the game'>
        {observers.map(observer => (
          <li key={observer.id}>{observer.userName}</li>
        ))}
      </ul>
      <ul aria-label='list of players in the game'>
        <li>{`X: ${xPlayer?.userName || '(No player yet!)'}`}</li>
        <li>{`O: ${oPlayer?.userName || '(No player yet!)'}`}</li>
      </ul>

      <div>{currentTurnMessage()}</div>
      {(status === 'WAITING_TO_START' || status === 'OVER') && !isPlayer && (
        <Button onClick={handleJoinGame} isLoading={loading}>
          {loading ? '' : 'Join New Game'}
        </Button>
      )}
      <TicTacToeBoard gameAreaController={gameAreaController} />
    </div>
  );
}

// Do not edit below this line
/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
 */
export default function TicTacToeAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      controller.leaveGame();
    }
  }, [townController, gameArea]);

  if (gameArea && gameArea.getData('type') === 'TicTacToe') {
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <TicTacToeArea interactableID={gameArea.name} />;
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
