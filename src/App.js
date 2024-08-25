import React, { useState } from 'react';
import './App.css';

const initialBoard = [
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', '']
];

const initialSetupA = ['A-P1', 'A-H1', 'A-H2', 'A-P2', 'A-P3']; // Player A's initial row setup
const initialSetupB = ['B-P1', 'B-H1', 'B-H2', 'B-P2', 'B-P3']; // Player B's initial row setup

function App() {
  const initializeBoard = (setupA, setupB) => {
    const newBoard = [...initialBoard];
    newBoard[0] = [...setupA]; // Player A's setup on the first row
    newBoard[4] = [...setupB]; // Player B's setup on the last row
    return newBoard;
  };

  const [board, setBoard] = useState(initializeBoard(initialSetupA, initialSetupB));
  const [currentPlayer, setCurrentPlayer] = useState('A');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]); // Change to an array for a sequential history
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);

  const handleMove = (character, move) => {
    const [charRow, charCol] = findCharacter(character, board);

    if (charRow === null || charCol === null) {
      setMessage('Character not found!');
      return;
    }

    const [newRow, newCol] = calculateNewPosition(charRow, charCol, move, character);
    if (isValidMove(charRow, charCol, newRow, newCol, character)) {
      const newBoard = board.map(row => [...row]);
      let killedCharacter = null;

      // Combat: Remove opponent if present in path (for Hero1 and Hero2) or at destination (for all)
      const path = getPath(charRow, charCol, newRow, newCol, character);
      path.forEach(([row, col]) => {
        if (board[row][col].startsWith(opponentPlayer(currentPlayer))) {
          killedCharacter = board[row][col];
          newBoard[row][col] = '';
        }
      });

      if (board[newRow][newCol].startsWith(opponentPlayer(currentPlayer))) {
        killedCharacter = board[newRow][newCol];
      }

      // Move character
      newBoard[charRow][charCol] = '';
      newBoard[newRow][newCol] = character;

      // Update history with current move
      setHistory(prevHistory => [
        ...prevHistory,
        {
          character,
          move,
          from: [charRow, charCol],
          to: [newRow, newCol],
          killed: killedCharacter // Add killed character to history entry
        }
      ]);

      setBoard(newBoard);
      setMessage('');
      setSelectedCharacter(null); // Reset selected character after move
      setAvailableMoves([]); // Clear available moves after move
      setCurrentPlayer(opponentPlayer(currentPlayer));

      if (checkWinningCondition(newBoard)) {
        setMessage(`${currentPlayer} wins!`);
        return;
      }
    } else {
      setMessage('Invalid Move!');
    }
  };

  const findCharacter = (character, board) => {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === character) {
          return [i, j];
        }
      }
    }
    return [null, null];
  };

  const calculateNewPosition = (row, col, move, character) => {
    const type = character.split('-')[1]; // Extract character type (P1, H1, H2)
    switch (type) {
      case 'P1':
      case 'P2':
      case 'P3':
        return movePawn(row, col, move);
      case 'H1':
        return moveHero1(row, col, move);
      case 'H2':
        return moveHero2(row, col, move);
      default:
        return [row, col];
    }
  };

  const movePawn = (row, col, move) => {
    switch (move) {
      case 'L': return [row, col - 1];
      case 'R': return [row, col + 1];
      case 'F': return currentPlayer === 'A' ? [row + 1, col] : [row - 1, col];
      case 'B': return currentPlayer === 'A' ? [row - 1, col] : [row + 1, col];
      default: return [row, col];
    }
  };

  const moveHero1 = (row, col, move) => {
    switch (move) {
      case 'L': return [row, col - 2];
      case 'R': return [row, col + 2];
      case 'F': return currentPlayer === 'A' ? [row + 2, col] : [row - 2, col];
      case 'B': return currentPlayer === 'A' ? [row - 2, col] : [row + 2, col];
      default: return [row, col];
    }
  };

  const moveHero2 = (row, col, move) => {
    switch (move) {
      case 'FL': return currentPlayer === 'A' ? [row + 2, col - 2] : [row - 2, col + 2];
      case 'FR': return currentPlayer === 'A' ? [row + 2, col + 2] : [row - 2, col - 2];
      case 'BL': return currentPlayer === 'A' ? [row - 2, col - 2] : [row + 2, col + 2];
      case 'BR': return currentPlayer === 'A' ? [row - 2, col + 2] : [row + 2, col - 2];
      default: return [row, col];
    }
  };

  const isValidMove = (oldRow, oldCol, newRow, newCol, character) => {
    console.log(`Validating move: oldRow=${oldRow}, oldCol=${oldCol}, newRow=${newRow}, newCol=${newCol}`);
    // Check if new position is within bounds
    const withinBounds = newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5;
    if (!withinBounds) {
      console.log('Move is out of bounds.');
      return false;
    }

    // Check if the new position is empty or occupied by the opponent
    const isEmptyOrOpponent = board[newRow] && (board[newRow][newCol] === '' || board[newRow][newCol].startsWith(opponentPlayer(currentPlayer)));
    console.log(`isEmptyOrOpponent=${isEmptyOrOpponent}`);
    return isEmptyOrOpponent;
  };

  const opponentPlayer = (currentPlayer) => (currentPlayer === 'A' ? 'B' : 'A');

  const checkWinningCondition = (board) => {
    const opponent = opponentPlayer(currentPlayer);
    return !board.flat().some(cell => cell.startsWith(opponent));
  };

  const getPath = (oldRow, oldCol, newRow, newCol, character) => {
    const type = character.split('-')[1];
    let path = [];
    if (type === 'H1' || type === 'H2') {
      const rowStep = newRow > oldRow ? 1 : newRow < oldRow ? -1 : 0;
      const colStep = newCol > oldCol ? 1 : newCol < oldCol ? -1 : 0;
      let r = oldRow + rowStep;
      let c = oldCol + colStep;
      while (r !== newRow || c !== newCol) {
        path.push([r, c]);
        r += rowStep;
        c += colStep;
      }
    }
    return path;
  };

  const selectCharacter = (character) => {
    setSelectedCharacter(character);
    if (character.endsWith('H1')) {
      setAvailableMoves(['L', 'R', 'F', 'B']);
    } else if (character.endsWith('P1') || character.endsWith('P2') || character.endsWith('P3')) {
      setAvailableMoves(['L', 'R', 'F', 'B']);
    } else {
      setAvailableMoves(['FL', 'FR', 'BR', 'BL']);
    }
  };

  return (
    <div className="App">
      <h1>Chess-like Game</h1>
      <h2>Current Player: {currentPlayer}</h2>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell ${cell ? 'occupied' : ''}`}
                onClick={() => selectCharacter(cell)}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="controls">
        {selectedCharacter && (
          <div>
            <h3>Available Moves for {selectedCharacter}</h3>
            {availableMoves.map((move) => (
              <button key={move} onClick={() => handleMove(selectedCharacter, move)}>
                {move}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="history">
        <h2>Move History</h2>
        {history.map((entry, index) => (
          <div key={index} className="history-entry">
            <h3>{entry.character} moved {entry.move}</h3>
            <p>From: [{entry.from[0]}, {entry.from[1]}] To: [{entry.to[0]}, {entry.to[1]}]</p>
            {entry.killed && <p>Killed: {entry.killed}</p>}
          </div>
        ))}
      </div>
      <div className="message">{message}</div>
    </div>
  );
}

export default App;
