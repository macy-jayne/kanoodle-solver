window.colorblindMode = window.colorblindMode || false;

function toggleColorblindMode(on) {
    window.colorblindMode = on;
  
    if (on) {
      // Just rerender all pieces to add letters
      pieces.forEach(piece => renderPiece(piece));
      renderPlacedPieces();
    } else {
      // Remove all letter overlays then rerender pieces without letters
      removeAllLetterOverlays();
      pieces.forEach(piece => renderPiece(piece));
      renderPlacedPieces();
    }
  }

  function removeAllLetterOverlays() {
    // Remove letters from all pieces in container
    document.querySelectorAll('#pieces .letter-overlay').forEach(el => el.remove());
  
    // Remove letters from all board cells
    document.querySelectorAll('#board .letter-overlay').forEach(el => el.remove());
  }
  

function clearBoard() {
      for (let i = 0; i < board.children.length; i++) {
        const cell = board.children[i];
        cell.style.backgroundColor = '';
        const overlays = cell.querySelectorAll('.board-piece-overlay');
        overlays.forEach(o => o.remove());
      }
      for (let cell of board.children) {
        cell.style.backgroundColor = '';
        // Remove overlays & letter overlays
        [...cell.querySelectorAll('.board-piece-overlay, .letter-overlay')].forEach(el => el.remove());
      }
      resetSolutionsView();
    }
  
    // Render all placed pieces on the board
    function renderPlacedPieces() {
        clearBoard();
      
        Object.entries(placedPieces).forEach(([id, { baseRow, baseCol }]) => {
          const piece = pieces.find(p => p.id === id);
          const transform = pieceTransforms[id];
          const shape = getTransformedShape(piece.shape, transform);
      
          shape.forEach(([x, y]) => {
            const r = baseRow + y;
            const c = baseCol + x;
            const idx = r * 11 + c;
            const cell = board.children[idx];
            cell.style.backgroundColor = piece.color;
      
            const overlay = document.createElement('div');
            overlay.classList.add('board-piece-overlay');
            overlay.style.position = 'absolute';
            overlay.style.left = '0';
            overlay.style.top = '0';
            overlay.style.width = '36px';
            overlay.style.height = '36px';
            overlay.style.cursor = 'grab';
            overlay.style.backgroundColor = 'rgba(0,0,0,0)';
            overlay.dataset.pieceId = id;
      
            if (window.colorblindMode) {
              const letterEl = document.createElement('div');
              letterEl.classList.add('letter-overlay');
              letterEl.textContent = piece.letter ? piece.letter.toUpperCase() : piece.id.charAt(0).toUpperCase();
              overlay.appendChild(letterEl);
            }
      
            // Click to remove piece from board
            overlay.addEventListener('click', (e) => {
              e.stopPropagation();
              removePieceFromBoard(id);
            });
      
            // Drag to move piece
            overlay.setAttribute('draggable', 'true');
      
            overlay.addEventListener('dragstart', (e) => {
              const pieceId = e.target.dataset.pieceId;
              const pos = placedPieces[pieceId];
              if (!pos) return;
      
              const piece = pieces.find(p => p.id === pieceId);
              const transform = pieceTransforms[pieceId];
              const shape = getTransformedShape(piece.shape, transform);
      
              const topLeftRow = pos.baseRow;
              const topLeftCol = pos.baseCol;
              const topLeftIdx = topLeftRow * 11 + topLeftCol;
              const topLeftCell = board.children[topLeftIdx];
              const topLeftRect = topLeftCell.getBoundingClientRect();
      
              const mouseX = e.clientX;
              const mouseY = e.clientY;
      
              const offsetX = mouseX - topLeftRect.left;
              const offsetY = mouseY - topLeftRect.top;
      
              e.dataTransfer.setData('text/plain', JSON.stringify({
                id: pieceId,
                offset: [Math.floor(offsetX / 36), Math.floor(offsetY / 36)],
                fromBoard: true
              }));
      
              const maxX = Math.max(...shape.map(([x]) => x));
              const maxY = Math.max(...shape.map(([_, y]) => y));
      
              const ghost = document.createElement('div');
              ghost.style.position = 'absolute';
              ghost.style.top = '-1000px';
              ghost.style.left = '-1000px';
              ghost.style.width = `${(maxX + 1) * 36}px`;
              ghost.style.height = `${(maxY + 1) * 36}px`;
              ghost.style.pointerEvents = 'none';
      
              shape.forEach(([gx, gy]) => {
                const gblock = document.createElement('div');
                gblock.classList.add('cell');
                gblock.style.position = 'absolute';
                gblock.style.width = '36px';
                gblock.style.height = '36px';
                gblock.style.backgroundColor = piece.color;
                gblock.style.left = `${gx * 36}px`;
                gblock.style.top = `${gy * 36}px`;
      
                if (window.colorblindMode) {
                  const letterEl = document.createElement('div');
                  letterEl.classList.add('letter-overlay');
                  letterEl.textContent = piece.letter ? piece.letter.toUpperCase() : piece.id.charAt(0).toUpperCase();
                  gblock.appendChild(letterEl);
                }
      
                ghost.appendChild(gblock);
              });
      
              document.body.appendChild(ghost);
              e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
      
              e.target.addEventListener('dragend', () => {
                document.body.removeChild(ghost);
              }, { once: true });
            });
      
            cell.appendChild(overlay);
          });
        });
      }
      
    function removePieceFromBoard(id) {
      delete placedPieces[id];
      // Return piece div back to pieces container if not already there
      let pieceEl = document.getElementById(id);
      if (!pieceEl || !document.body.contains(pieceEl)) {
        pieceEl = document.createElement('div');
        pieceEl.id = id;
        pieceEl.classList.add('piece');
        pieceEl.style.position = 'relative';
        pieceEl.draggable = false;
        piecesContainer.appendChild(pieceEl);
        renderPiece(pieces.find(p => p.id === id));

        // Re-add transformation listener
        pieceEl.addEventListener('click', (e) => {
          const transform = pieceTransforms[id];
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

          renderPiece(pieces.find(p => p.id === id));
        });
      } else if (!piecesContainer.contains(pieceEl)) {
        piecesContainer.appendChild(pieceEl);
      }

      
      renderPlacedPieces();
      renderPiece(pieces.find(p => p.id === id));
      resetSolutionsView()
    }
