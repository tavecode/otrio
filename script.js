//npx tailwindcss -i ./input.css -o ./output.css --watch
function createPiece(size){
  if (size === 'sm'){
    const smSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    smSvg.setAttribute('fill', 'none')
    smSvg.setAttribute('width', '28')
    smSvg.setAttribute('height', '28')
    smSvg.setAttribute('viewBox', '0 0 28 28')
    const smCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    smCircle.setAttribute('cx', '13.75')
    smCircle.setAttribute('cy', '13.75')
    smCircle.setAttribute('r', '10.3125')
    smCircle.setAttribute('stroke', 'currentColor')
    smCircle.setAttribute('stroke-width', '6.875')
    smSvg.appendChild(smCircle)
    smSvg.style.position = 'absolute'
    smSvg.style.zIndex = 30
    return smSvg
  }
  if (size === 'md'){
    const mdSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    mdSvg.setAttribute('fill', 'none')
    mdSvg.setAttribute('width', '55')
    mdSvg.setAttribute('height', '55')
    mdSvg.setAttribute('viewBox', '0 0 55 55')
    const mdCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    mdCircle.setAttribute('cx', '27.5')
    mdCircle.setAttribute('cy', '27.5')
    mdCircle.setAttribute('r', '24.0625')
    mdCircle.setAttribute('stroke', 'currentColor')
    mdCircle.setAttribute('stroke-width', '6.875')
    mdSvg.appendChild(mdCircle)
    mdSvg.style.position = 'absolute'
    mdSvg.style.zIndex = 20
    return mdSvg
  }
  if (size === 'lg'){
    const lgSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    lgSvg.setAttribute('fill', 'none')
    lgSvg.setAttribute('width', '83')
    lgSvg.setAttribute('height', '83')
    lgSvg.setAttribute('viewBox', '0 0 83 83')
    const lgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    lgCircle.setAttribute('x', '3.4375')
    lgCircle.setAttribute('y', '3.4375')
    lgCircle.setAttribute('width', '75.625')
    lgCircle.setAttribute('height', '75.625')
    lgCircle.setAttribute('rx', '37.8125')
    lgCircle.setAttribute('stroke', 'currentColor')
    lgCircle.setAttribute('stroke-width', '6.875')
    lgSvg.appendChild(lgCircle)
    lgSvg.style.position = 'absolute'
    lgSvg.style.zIndex = 15
    return lgSvg
  }
}

const numbersToWords = {
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four'
}

const coordinatesToIndex = {
  a1: 0,
  b1: 1,
  c1: 2,
  a2: 3,
  b2: 4,
  c2: 5,
  a3: 6,
  b3: 7,
  c3: 8
}

const turnIndicator = document.querySelector('#turn-display')
const gameOverModal = document.querySelector('#gameover-modal')
const noMovesModal = document.querySelector('#nomoves-modal')
const noMovesText = document.querySelector('#nomoves-playername')
const noMovesButton = document.querySelector('#nomoves-btn')
noMovesButton.addEventListener('click', () => {
  noMovesModal.close()
  passTurn()
})
const outPlayers = []

const gameState = {
  currentPlayerTurn: 1,
  usedPieces: [],
  boardSquares: [...Array(9)].map(() => [null, null, null]),
  selectedPieces: {
    player1: {
      spot: 1,
      size: 'sm'
    },
    player2: {
      spot: 1,
      size: 'sm'
    },
    player3: {
      spot: 1,
      size: 'sm'
    },
    player4: {
      spot:  1,
      size: 'sm'
    },
  },
  highlightedPiece: {
    player: 1,
    spot: 1,
    size: 'sm',
    element: null
  },
  gameOver: false
}

const trap = {
  get(obj, prop){
    const requestedValue = Reflect.get(...arguments)
    if (
      requestedValue &&
      typeof requestedValue === "object" &&
      ["Array", "Object"].includes(requestedValue.constructor.name)
    ) return new Proxy(requestedValue, trap)
    return requestedValue
  },

  set(obj, prop, newval){
    let pieceToHighlight = null
    let pieceToUnhighlight = null

    switch(prop){
      case 'gameOver':
        if (newval === true){
          const activePlayerPieces = document.querySelectorAll('.active-turn')
          activePlayerPieces.forEach(piece => piece.classList.remove('active-turn'))
        } 
        obj[prop] = newval
        return true
      case 'boardSquares':
        if (gameState.gameOver === true) return

        if (newval === null){
          obj[prop] = [...Array(9)].map(() => [null, null, null])
          const gamePieces = document.querySelectorAll('.game-piece')
          gamePieces.forEach(piece => piece.remove())
          return true
        }

        const slotNumber = newval.size === 'sm'
          ? 0
          : newval.size === 'md'
          ? 1
          : 2
        const boardClone = structuredClone(obj[prop])
        boardClone[coordinatesToIndex[newval.square]][slotNumber] = gameState.currentPlayerTurn
        obj[prop] = boardClone

        const square = document.querySelector(`.board-square#${newval.square}`)
        const newPiece = createPiece(newval.size)
        newPiece.classList.add(`player-${numbersToWords[gameState.currentPlayerTurn]}`, 'game-piece')
        square.append(newPiece)

        return true
      case 'usedPieces':
        if (gameState.gameOver === true) return

        if (newval === null){
          const piecesToRemoveFromBench = document.querySelectorAll('.benched-piece')
          piecesToRemoveFromBench.forEach(piece => piece.remove())

          obj[prop] = []

          benchPieces()

          return true
        }

        obj[prop] = [...obj[prop], newval]

        const pieceToRemoveFromBench = document.querySelector(`#p${newval.player}b${newval.spot} .benched-piece.${newval.size}-piece`)
        pieceToRemoveFromBench.remove()

        return true
      case 'highlightedPiece':
        if (gameState.gameOver === true) return

        const allBoardGrooves = document.querySelectorAll('.board-square .groove')
        allBoardGrooves.forEach(groove => groove.classList.remove('size-matched'))

        if (newval !== null){
          newval.element.classList.add('highlight')

          const sizeMatchedSlots = document.querySelectorAll(`.board-square .${newval.size}-groove`)
          sizeMatchedSlots.forEach(slot => slot.classList.add('size-matched'))
        }

        obj[prop] = newval
        return true
      // Selected Pieces:
      case 'selectedPieces':
        if (newval === null){
          obj[prop] = {
            player1: {
              spot: 1,
              size: 'sm'
            },
            player2: {
              spot: 1,
              size: 'sm'
            },
            player3: {
              spot: 1,
              size: 'sm'
            },
            player4: {
              spot:  1,
              size: 'sm'
            },
          }
        } else {
          obj[prop] = newval
        }
      case 'player1':
      case 'player2':
      case 'player3':
      case 'player4':
        if (gameState.gameOver === true) return

        const playerNumber = Number(prop.charAt(6))
        if (gameState.currentPlayerTurn !== playerNumber) return

        obj[prop] = newval
        if (newval === null){
          gameStateUpdater.highlightedPiece = null
          return true
        }

        if (gameState.highlightedPiece){
          pieceToUnhighlight = gameState.highlightedPiece.element
          pieceToUnhighlight.classList.remove('highlight')
        }

        pieceToHighlight = document.querySelector(`#p${playerNumber}b${newval.spot} .benched-piece.${newval.size}-piece`)

        gameStateUpdater.highlightedPiece = {
          player: playerNumber,
          spot: newval.spot,
          size: newval.size,
          element: pieceToHighlight
        }

        return true
      case 'currentPlayerTurn':
        if (gameState.gameOver === true) return

        const lastPlayersBenchedPieces = document.querySelectorAll(`.benched-piece.player-${numbersToWords[String(obj.currentPlayerTurn)]}`)
        lastPlayersBenchedPieces.forEach(piece => piece.classList.remove('active-turn'))
        const currentPlayersBenchedPieces = document.querySelectorAll(`.benched-piece.player-${numbersToWords[String(newval)]}`)
        currentPlayersBenchedPieces.forEach(piece => piece.classList.add('active-turn'))

        obj[prop] = newval

        if (obj.highlightedPiece){
          pieceToUnhighlight = obj.highlightedPiece.element
          pieceToUnhighlight.classList.remove('highlight')
        }

        const moveIsAvailable = checkForAvailableMove()
        if (!moveIsAvailable || (moveIsAvailable === 'game over')) return

        const selectedPiece = obj.selectedPieces[`player${obj.currentPlayerTurn}`]
        if (selectedPiece){
          pieceToHighlight = document.querySelector(
            `#p${obj.currentPlayerTurn}b${selectedPiece.spot} .benched-piece.${selectedPiece.size}-piece`
          )
          gameStateUpdater.highlightedPiece = {
            player: obj.currentPlayerTurn,
            ...selectedPiece,
            element: pieceToHighlight
          }
        } else {
          for (let i = 0; i < 3; i++){
            if (
              !gameState.usedPieces.some(uP => (
                uP.player === obj.currentPlayerTurn && uP.spot === i + 1 && uP.size === 'sm'
              ))
            ){ 
              gameStateUpdater.selectedPieces[`player${obj.currentPlayerTurn}`] = { 
                player: obj.currentPlayerTurn,
                spot: i + 1, 
                size: 'sm'
              }
              break
            }
            if (
              !gameState.usedPieces.some(uP => (
                uP.player === obj.currentPlayerTurn && uP.spot === i + 1 && uP.size === 'md'
              ))
            ){ 
              gameStateUpdater.selectedPieces[`player${obj.currentPlayerTurn}`] = { 
                player: obj.currentPlayerTurn,
                spot: i + 1, 
                size: 'md'
              }
              break
            }
            if (
              !gameState.usedPieces.some(uP => (
                uP.player === obj.currentPlayerTurn && uP.spot === i + 1 && uP.size === 'lg'
              ))
            ){ 
              gameStateUpdater.selectedPieces[`player${obj.currentPlayerTurn}`] = { 
                player: obj.currentPlayerTurn,
                spot: i + 1, 
                size: 'lg'
              }
              break
            }
          }
        }
        
        turnIndicator.textContent = `Player ${obj.currentPlayerTurn}'s Turn`
        switch (obj.currentPlayerTurn){
          case 1:
            turnIndicator.style.color = '#2dd4bf'
            break
          case 2:
            turnIndicator.style.color = '#818cf8'
            break
          case 3:
            turnIndicator.style.color = '#94a3b8'
            break
          case 4:
            turnIndicator.style.color = '#38bdf8'
            break
        }

        return true
      default:
        obj[prop] = newval
        return true
    }
  }
}

function checkForAvailableMove(){
  const playerNumber = gameState.currentPlayerTurn

  if (!outPlayers.includes(playerNumber)){
    let sm = 0
    let md = 0
    let lg = 0
    gameState.usedPieces.forEach(uP => {
      if (uP.player === playerNumber){
        if (uP.size === 'sm') ++sm
        if (uP.size === 'md') ++md
        if (uP.size === 'lg') ++lg
      }
    })

    smSpaceAvailable = false
    mdSpaceAvailable = false
    lgSpaceAvailable = false
    gameState.boardSquares.forEach(square => {
      if (square[0] === null) smSpaceAvailable = true
      if (square[1] === null) mdSpaceAvailable = true
      if (square[2] === null) lgSpaceAvailable = true
    })

    if (
      !(
        (smSpaceAvailable && sm < 3) || 
        (mdSpaceAvailable && md < 3) || 
        (lgSpaceAvailable && lg < 3)
      )
    ){
      outPlayers.push(playerNumber)
      if (outPlayers.length === 4){
        endGame('drawNOMOVES')
        return 'game over'
      }
      noMovesModal.showModal()
      noMovesText.textContent = `Player ${playerNumber}`
      switch (playerNumber){
        case 1:
          noMovesText.style.color = '#2dd4bf'
          break
        case 2:
          noMovesText.style.color = '#818cf8'
          break
        case 3:
          noMovesText.style.color = '#94a3b8'
          break
        case 4:
          noMovesText.style.color = '#38bdf8'
          break
      }
      return false
    }
  } else {
    passTurn()
    return false
  }

  return true
}

const gameStateUpdater = new Proxy(gameState, trap)

function benchPieces(){
  const benches = document.querySelectorAll('.bench-square')
  benches.forEach((bench, index) => {
    const smSvg = createPiece('sm')
    smSvg.classList.add('benched-piece', 'sm-piece')
    const mdSvg = createPiece('md')
    mdSvg.classList.add('benched-piece', 'md-piece')
    const lgSvg = createPiece('lg')
    lgSvg.classList.add('benched-piece', 'lg-piece')

    switch (true){
      case bench.id.charAt(1) == 4:
        smSvg.classList.add('player-four')
        mdSvg.classList.add('player-four')
        lgSvg.classList.add('player-four')
        break
      case bench.id.charAt(1) == 1:
        smSvg.classList.add('player-one')
        mdSvg.classList.add('player-one')
        lgSvg.classList.add('player-one')
        break
      case bench.id.charAt(1) == 3:
        smSvg.classList.add('player-three')
        mdSvg.classList.add('player-three')
        lgSvg.classList.add('player-three')
        break
      default:
        smSvg.classList.add('player-two')
        mdSvg.classList.add('player-two')
        lgSvg.classList.add('player-two')
        break
    }

    bench.appendChild(smSvg)
    bench.appendChild(mdSvg)
    bench.appendChild(lgSvg)

    smSvg.addEventListener('click', () => {
      if (bench.id.charAt(1) != gameState.currentPlayerTurn) return

      gameStateUpdater.selectedPieces[`player${bench.id.charAt(1)}`] = {
        spot: Number(bench.id.charAt(3)),
        size: 'sm'
      }
    })
    mdSvg.addEventListener('click', () => {
      if (bench.id.charAt(1) != gameState.currentPlayerTurn) return

      gameStateUpdater.selectedPieces[`player${bench.id.charAt(1)}`] = {
        spot: Number(bench.id.charAt(3)),
        size: 'md'
      }
    })
    lgSvg.addEventListener('click', () => {
      if (bench.id.charAt(1) != gameState.currentPlayerTurn) return

      gameStateUpdater.selectedPieces[`player${bench.id.charAt(1)}`] = {
        spot: Number(bench.id.charAt(3)),
        size: 'lg'
      }
    })
  })
}

function setUpButtonsAndModals(){
  const restartButton = document.querySelector('#restart-btn')
  const restartConfirmationModal = document.querySelector('#areyousure-modal')
  restartButton.addEventListener('click', () => {
    restartConfirmationModal.showModal()
  })
  const cancelRestartbutton = document.querySelector('#areyousure-cancel-btn')
  cancelRestartbutton.addEventListener('click', () => {
    restartConfirmationModal.close()
  })
  const resetButtons = document.querySelectorAll('#areyousure-confirm-btn, #newgame-btn')
  resetButtons.forEach(btn => btn.addEventListener('click', resetGame))

  const showBoardButton = document.querySelector('#viewboard-btn')
  showBoardButton.addEventListener('click', showEndgameBoard)

  const howToPlayButton = document.querySelector('#howtoplay-btn')
  const howToPlayModal = document.querySelector('#howtoplay-modal')
  howToPlayButton.addEventListener('click', () => {
    howToPlayModal.showModal()
  })
  const howToPlayCloseButton = document.querySelector('#howtoplay-close-btn')
  howToPlayCloseButton.addEventListener('click', () => {
    howToPlayModal.close()
  })
}

function readyPlayerOne(){
  const playerOnePieces = document.querySelectorAll('.benched-piece.player-one')
  playerOnePieces.forEach(piece => piece.classList.add('active-turn'))
  const firstPiece = document.querySelector('#p1b1 .benched-piece.sm-piece')
  gameStateUpdater.highlightedPiece = {
    ...gameState.highlightedPiece,
    element: firstPiece
  }
}

function attachBoardListeners(){
  const allBoardSquares = document.querySelectorAll('.board-square')
  allBoardSquares.forEach(square => {
    square.addEventListener('click', () => {
      if (gameState.currentPlayerTurn === 'OVER') return

      dropPiece(square)
    })
  })
}

function dropPiece(square){
  const selectedPiece = gameState.selectedPieces[`player${gameState.currentPlayerTurn}`]
  if (!selectedPiece) return
  const slotNumber = selectedPiece.size === 'sm'
    ? 0
    : selectedPiece.size === 'md'
    ? 1
    : 2
  if (gameState.boardSquares[coordinatesToIndex[square.id]][slotNumber] !== null) return

  gameStateUpdater.usedPieces = { 
    player: gameState.currentPlayerTurn,
    ...selectedPiece
  }

  gameStateUpdater.boardSquares = { square: square.id, size: selectedPiece.size }
  
  gameStateUpdater.selectedPieces[`player${gameState.currentPlayerTurn}`] = null

  winCheck()

  passTurn()
}

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6] 
]

function winCheck(){
  const boardSquares = gameState.boardSquares
  boardSquares.forEach(square => {
    if (
      square[0] !== null &&
      (square[0] === square[1] && square[1] === square[2])
    ) return endGame('win', square[0])
  })

  for (let line of lines){
    const [a, b, c] = line
    for (const space in boardSquares[a]){
      if (boardSquares[a][space] === null) continue
      if (
        boardSquares[a][space] ===  boardSquares[b][space] && 
        boardSquares[b][space] === boardSquares[c][space]
      ){
        return endGame('win', boardSquares[a][space])
      }
    }

    if (
      (
        boardSquares[a][0] !== null && 
        (boardSquares[a][0] === boardSquares[b][1] && boardSquares[b][1] === boardSquares[c][2])
      ) || (
        boardSquares[a][2] !== null && 
        (boardSquares[a][2] === boardSquares[b][1] && boardSquares[b][1] === boardSquares[c][0])
      )
    ) return endGame('win', boardSquares[b][1])
  }

  if (boardSquares.every(square => square.every(space => space !== null))) endGame('draw')
}

function passTurn(){
  gameState.currentPlayerTurn < 4
  ? gameStateUpdater.currentPlayerTurn = gameState.currentPlayerTurn + 1
  : gameStateUpdater.currentPlayerTurn = 1
}

function endGame(outcome, playerNumber){
  gameOverModal.showModal()
  const outcomeDisplay = document.querySelector('#winner-display')
  if (outcome === 'draw'){
    outcomeDisplay.textContent = 'DRAW'
    outcomeDisplay.style.color = '#fde68a'
  } else if (outcome === 'drawNOMOVES'){
    outcomeDisplay.textContent = 'DRAW (no possible moves)'
    outcomeDisplay.style.color = '#fde68a'
  } else {
    outcomeDisplay.textContent = `Player ${playerNumber} Wins!`
    switch (playerNumber){
      case 1:
        outcomeDisplay.style.color = '#2dd4bf'
        break
      case 2:
        outcomeDisplay.style.color = '#818cf8'
        break
      case 3:
        outcomeDisplay.style.color = '#94a3b8'
        break
      case 4:
        outcomeDisplay.style.color = '#38bdf8'
        break
    }
  }

  gameStateUpdater.gameOver = true

  const gameOverMessage = document.createElement('span')
  gameOverMessage.textContent = 'GAME OVER'
  gameOverMessage.classList.add('game-over-message')
  const gameBoard = document.querySelector('#game-board')
  gameBoard.append(gameOverMessage)
}

function showEndgameBoard(){
  gameOverModal.close()
}

function resetGame(){
  gameOverModal.close()
  const restartConfirmationModal = document.querySelector('#areyousure-modal')
  restartConfirmationModal.close()
  const gameOverMessage = document.querySelector('.game-over-message')//add game over message could possibly be moved to trap
  if (gameOverMessage) gameOverMessage.remove()

  gameStateUpdater.gameOver = false

  gameStateUpdater.boardSquares = null

  gameStateUpdater.usedPieces = null

  gameStateUpdater.selectedPieces = null

  gameStateUpdater.currentPlayerTurn = 1
}

function init(){
  setUpButtonsAndModals()

  attachBoardListeners()

  benchPieces()

  readyPlayerOne()
}
init()
