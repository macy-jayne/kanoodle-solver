document.addEventListener('DOMContentLoaded', () => {
    window.board = document.getElementById('board');
    window.piecesContainer = document.getElementById('pieces');  
    window.result = document.getElementById('result');
    const checkBtn = document.getElementById('check-btn');
    const resetBtn = document.getElementById('reset-btn');
    const instructBtn = document.getElementById('instructions-btn');
  
    // Create 5x11 board = 55 cells
    for (let i = 0; i < 55; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const row = Math.floor(i / 11);
      const col = i % 11;
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.style.position = 'relative'; // for stacking children later
      board.appendChild(cell);
    }
  
    checkBtn.addEventListener('click', () => {
      // Deep copy placedPieces and pieceTransforms before solving
      window.userPlacedPieces = JSON.parse(JSON.stringify(placedPieces));
      window.userPieceTransforms = JSON.parse(JSON.stringify(pieceTransforms));
    
      result.textContent = 'Checking solvability...';
      checkSolvability();
    }); 
    
    resetBtn.addEventListener('click', () => {
      // Clear result text
      if (window.result) window.result.textContent = '';
    
      // 1) Clear board cell contents (remove any placed-piece DOM nodes)
      const cells = document.querySelectorAll('#board .cell');
      cells.forEach(cell => {
        // Remove all children (placed piece visuals)
        while (cell.firstChild) cell.removeChild(cell.firstChild);
        // Reset any inline styles used for showing occupancy
        cell.style.backgroundColor = '';
      });
    
      // 2) Clear tracking objects
      for (let key in placedPieces) delete placedPieces[key];
      for (let key in pieceTransforms) delete pieceTransforms[key];
    
      // 3) Recreate pieces in the pieces container
      piecesContainer.innerHTML = ''; // empty container
    
      pieces.forEach(piece => {
        // reset transform state
        pieceTransforms[piece.id] = { rotation: 0, flippedH: false, flippedV: false };
    
        // create piece element (same logic as initial setup)
        const pieceEl = document.createElement('div');
        pieceEl.classList.add('piece');
        pieceEl.id = piece.id;
        pieceEl.style.position = 'relative';
        pieceEl.draggable = false;
    
        piecesContainer.appendChild(pieceEl);
    
        // draw the piece (your renderPiece should locate element by id and use pieceTransforms)
        renderPiece(piece);
    
        // reattach the click handler (same behavior as initial setup)
        pieceEl.addEventListener('click', (e) => {
          const transform = pieceTransforms[piece.id];
          const rot = ((transform.rotation % 360) + 360) % 360;
    
          if (e.altKey) {
            if (rot === 0 || rot === 180) transform.flippedV = !transform.flippedV;
            else transform.flippedH = !transform.flippedH;
          } else if (e.shiftKey) {
            if (rot === 0 || rot === 180) transform.flippedH = !transform.flippedH;
            else transform.flippedV = !transform.flippedV;
          } else {
            transform.rotation = (transform.rotation + 90) % 360;
          }
    
          renderPiece(piece);
        });
      });
    
      // 4) Re-render board (will be empty)
      renderPlacedPieces();
    
      console.log("Board cleared, all pieces reset.");
    });

    instructBtn.addEventListener("click", () => {
      popupOverlay.style.visibility = "visible";
    });
    
    closePopupBtn.addEventListener("click", () => {
      popupOverlay.style.visibility = "hidden";
    });
    
    window.addEventListener("click", (event) => {
      if (event.target === popupOverlay) {
        popupOverlay.style.visibility = "hidden";
      }
    });  
  
    pieces.forEach(piece => {
      const pieceEl = document.createElement('div');
      pieceEl.classList.add('piece');
      pieceEl.id = piece.id;
      pieceEl.style.position = 'relative';
      pieceEl.draggable = false;
  
      pieceTransforms[piece.id] = { rotation: 0, flippedH: false, flippedV: false };
  
      piecesContainer.appendChild(pieceEl);
  
      renderPiece(piece);
  
      pieceEl.addEventListener('click', (e) => {
        const transform = pieceTransforms[piece.id];
        const rot = ((transform.rotation % 360) + 360) % 360;
  
        if (e.altKey) {
          if (rot === 0 || rot === 180) {
            transform.flippedV = !transform.flippedV;
          } else {
            transform.flippedH = !transform.flippedH;
          }
        } else if (e.shiftKey) {
          if (rot === 0 || rot === 180) {
            transform.flippedH = !transform.flippedH;
          } else {
            transform.flippedV = !transform.flippedV;
          }
        } else {
          transform.rotation = (transform.rotation + 90) % 360;
        }
  
        renderPiece(piece);
      });
    });
      
  
    // Board cells drag & drop handling for placing or moving pieces
    document.querySelectorAll('#board .cell').forEach(cell => {
      cell.addEventListener('dragover', e => e.preventDefault());
  
      cell.addEventListener('drop', e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const { id, offset, fromBoard } = data;
        const [dragX, dragY] = offset;
        const piece = pieces.find(p => p.id === id);
  
        const baseRow = parseInt(cell.dataset.row) - dragY;
        const baseCol = parseInt(cell.dataset.col) - dragX;
  
        const transform = pieceTransforms[id];
        const transformedShape = getTransformedShape(piece.shape, transform);
  
        // Temporarily remove the piece for overlap check
        const existingShape = fromBoard ? getTransformedShape(piece.shape, transform) : [];
        const originalCoords = fromBoard && placedPieces[id]
          ? new Set(existingShape.map(([x, y]) => {
              const r = placedPieces[id].baseRow + y;
              const c = placedPieces[id].baseCol + x;
              return `${r},${c}`;
            }))
          : new Set();

        const valid = transformedShape.every(([x, y]) => {
          const r = baseRow + y;
          const c = baseCol + x;
          if (r < 0 || r >= 5 || c < 0 || c >= 11) return false;
          const idx = r * 11 + c;
          const target = board.children[idx];
          const coordKey = `${r},${c}`;
          return (
            target &&
            (target.style.backgroundColor === '' || originalCoords.has(coordKey))
          );
        });

  
        if (!valid) {
          console.warn('Invalid drop: out of bounds or overlapping');
          return;
        }
  
        // If moving from board, remove old placement first
        if (fromBoard) {
          delete placedPieces[id];
        } else {
          // Remove piece div from pieces container if it's coming from there
          const pieceEl = document.getElementById(id);
          if (pieceEl && piecesContainer.contains(pieceEl)) {
            pieceEl.remove();
          }
        }
  
        // Record new placement
        placedPieces[id] = { baseRow, baseCol };
  
        // Re-render all placed pieces
        renderPlacedPieces();
      });
    });
  
    // Allow pieces container to accept drops from board pieces to remove them
    piecesContainer.addEventListener('dragover', e => e.preventDefault());
  
    piecesContainer.addEventListener('drop', e => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.fromBoard) {
        removePieceFromBoard(data.id);
      }
    });
  
    // Initial render of placed pieces (none yet)
    renderPlacedPieces();
    
  });

  const colorblindToggle = document.getElementById('colorblind-toggle'); // your slider toggle element

colorblindToggle.addEventListener('change', (e) => {
  window.colorblindMode = e.target.checked;
  // Re-render all pieces in pieces container
  pieces.forEach(piece => renderPiece(piece));
  // Re-render pieces placed on the board
  renderPlacedPieces();

  // If viewing solutions, re-render the solution display too
  if (window.isViewingSolution) {
    displaySolution(window.currentSolutionIndex);
  }
});

// After showing solutions, enable Find All Solutions
function showViewSolutionsButton() {
  let btn = document.getElementById("view-solutions-btn");
  if (!btn) {
      btn = document.createElement("button");
      btn.id = "view-solutions-btn";
      btn.textContent = "View Solutions";
      btn.addEventListener("click", () => {
          window.isViewingSolution = true;
          window.currentSolutionIndex = 0;
          displaySolution(window.currentSolutionIndex);
          toggleSolutionNavigation(window.solutions.length > 1, window.solutions.length);
          createExitButton();
          btn.style.display = "none";
          const checkBtn = document.getElementById("check-btn");
          const resetBtn = document.getElementById("reset-btn");
          if (checkBtn) checkBtn.style.display = "none";
          if (resetBtn) resetBtn.style.visibility = "hidden";

          disableBoardInteraction();
          // Show Find All Solutions button
          showFindAllSolutionsButton();
      });
      result.insertAdjacentElement("afterend", btn);
  }
  btn.style.display = "inline-block";
}


  
