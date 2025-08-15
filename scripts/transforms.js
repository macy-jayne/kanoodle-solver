function getTransformedShape(shape, transform) {
      let transformed = shape.map(([x, y]) => [x, y]);
  
      if (transform.flippedH) {
        const maxX = Math.max(...transformed.map(([x]) => x));
        transformed = transformed.map(([x, y]) => [maxX - x, y]);
      }
      if (transform.flippedV) {
        const maxY = Math.max(...transformed.map(([_, y]) => y));
        transformed = transformed.map(([x, y]) => [x, maxY - y]);
      }
  
      const times = ((transform.rotation / 90) % 4 + 4) % 4;
      for (let i = 0; i < times; i++) {
        transformed = transformed.map(([x, y]) => [-y, x]);
        const minX = Math.min(...transformed.map(([x]) => x));
        const minY = Math.min(...transformed.map(([_, y]) => y));
        transformed = transformed.map(([x, y]) => [x - minX, y - minY]);
      }
      return transformed;
    }
  
    function renderPiece(piece) {
        const pieceEl = document.getElementById(piece.id);
        if (!pieceEl) {
          // Element doesn't exist in the DOM, skip rendering
          return;
        }
      
        const transform = pieceTransforms[piece.id];
        const shape = getTransformedShape(piece.shape, transform);
      
        pieceEl.innerHTML = '';
      
        const maxX = Math.max(...shape.map(([x]) => x));
        const maxY = Math.max(...shape.map(([_, y]) => y));
        pieceEl.style.width = `${(maxX + 1) * 36}px`;
        pieceEl.style.height = `${(maxY + 1) * 36}px`;
      
        shape.forEach(([x, y]) => {
          const block = document.createElement('div');
          block.classList.add('cell', 'block');
          block.style.backgroundColor = piece.color;
          block.style.position = 'absolute';
          block.style.left = `${x * 36}px`;
          block.style.top = `${y * 36}px`;
          block.setAttribute('draggable', 'true');
      
          if (window.colorblindMode) {
            const letterEl = document.createElement('div');
            letterEl.classList.add('letter-overlay');
            letterEl.textContent = piece.letter ? piece.letter.toUpperCase() : piece.id.charAt(0).toUpperCase();
            block.appendChild(letterEl);
          }
      
          block.addEventListener('dragstart', (e) => {
            const pieceEl = e.target.closest('.piece');
            const pieceRect = pieceEl.getBoundingClientRect();
      
            const mouseX = e.clientX - pieceRect.left;
            const mouseY = e.clientY - pieceRect.top;
      
            e.dataTransfer.setData('text/plain', JSON.stringify({
              id: pieceEl.id,
              offset: [Math.floor(mouseX / 36), Math.floor(mouseY / 36)],
              fromBoard: false  // dragging from pieces container
            }));
      
            const shape = getTransformedShape(piece.shape, pieceTransforms[piece.id]);
            const maxX = Math.max(...shape.map(([x]) => x));
            const maxY = Math.max(...shape.map(([_, y]) => y));
      
            const ghost = document.createElement('div');
            ghost.style.position = 'absolute';
            ghost.style.top = '-1000px';
            ghost.style.left = '-1000px';
            ghost.style.width = `${(maxX + 1) * 36}px`;
            ghost.style.height = `${(maxY + 1) * 36}px`;
            ghost.style.pointerEvents = 'none';
            ghost.style.display = 'block';
      
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
            e.dataTransfer.setDragImage(ghost, mouseX, mouseY);
      
            e.target.addEventListener('dragend', () => {
              document.body.removeChild(ghost);
            }, { once: true });
          });
      
          pieceEl.appendChild(block);
        });
      }