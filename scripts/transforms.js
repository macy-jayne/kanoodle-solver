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
  if (!pieceEl) return;

  // Ensure transform object exists
  if (!pieceTransforms[piece.id]) pieceTransforms[piece.id] = { rotation: 0, flippedH: false, flippedV: false };
  const transform = pieceTransforms[piece.id];
  const shape = getTransformedShape(piece.shape, transform);

  // Clear previous content
  pieceEl.innerHTML = '';

  // Compute piece dimensions
  const maxX = Math.max(...shape.map(([x]) => x));
  const maxY = Math.max(...shape.map(([_, y]) => y));
  const blockSize = 36;
  const pieceWidth = (maxX + 1) * blockSize;
  const pieceHeight = (maxY + 1) * blockSize;

  // Set fixed container height for alignment of buttons
  const maxPieceHeightInBlocks = 4; // adjust if needed
  const controlsReserve = 44; // space for buttons
  pieceEl.style.width = `${pieceWidth}px`;
  pieceEl.style.height = `${maxPieceHeightInBlocks * blockSize + controlsReserve}px`;
  pieceEl.style.position = 'relative';
  pieceEl.style.display = 'flex';
  pieceEl.style.flexDirection = 'column';
  pieceEl.style.alignItems = 'center';
  pieceEl.style.justifyContent = 'flex-start';
  pieceEl.style.backgroundColor = 'transparent';
  pieceEl.style.margin = pieceEl.style.margin || '6px';
  pieceEl.style.boxSizing = 'content-box';

  // Container for blocks
  const blocksContainer = document.createElement('div');
  blocksContainer.classList.add('piece-blocks');
  blocksContainer.style.position = 'relative';
  blocksContainer.style.width = `${pieceWidth}px`;
  blocksContainer.style.height = `${maxPieceHeightInBlocks * blockSize}px`;
  
  // Place blocks absolutely inside the container
  shape.forEach(([x, y]) => {
    const block = document.createElement('div');
    block.classList.add('cell', 'block');
    block.style.width = `${blockSize}px`;
    block.style.height = `${blockSize}px`;
    block.style.backgroundColor = piece.color;
    block.style.position = 'absolute';
    block.style.left = `${x * blockSize}px`;
    block.style.top = `${y * blockSize}px`;
    block.setAttribute('draggable', 'true');

    // Optional: letter overlay for colorblind mode
    if (window.colorblindMode) {
      const letterEl = document.createElement('div');
      letterEl.classList.add('letter-overlay');
      letterEl.textContent = piece.letter ? piece.letter.toUpperCase() : piece.id.charAt(0).toUpperCase();
      block.appendChild(letterEl);
    }

    // Drag logic
    block.addEventListener('dragstart', (e) => {
      const pieceRect = pieceEl.getBoundingClientRect();
      const mouseX = e.clientX - pieceRect.left;
      const mouseY = e.clientY - pieceRect.top;

      e.dataTransfer.setData('text/plain', JSON.stringify({
        id: pieceEl.id,
        offset: [Math.floor(mouseX / blockSize), Math.floor(mouseY / blockSize)],
        fromBoard: false
      }));

      // Ghost
      const ghost = document.createElement('div');
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      ghost.style.left = '-1000px';
      ghost.style.width = `${pieceWidth}px`;
      ghost.style.height = `${pieceHeight}px`;
      ghost.style.pointerEvents = 'none';

      shape.forEach(([gx, gy]) => {
        const gblock = document.createElement('div');
        gblock.classList.add('cell');
        gblock.style.position = 'absolute';
        gblock.style.width = `${blockSize}px`;
        gblock.style.height = `${blockSize}px`;
        gblock.style.backgroundColor = piece.color;
        gblock.style.left = `${gx * blockSize}px`;
        gblock.style.top = `${gy * blockSize}px`;

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

    blocksContainer.appendChild(block);
  });

  pieceEl.appendChild(blocksContainer);

  // Controls container below blocks
  const btnContainer = document.createElement('div');
  btnContainer.classList.add('piece-controls');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '6px';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.marginTop = '6px';

  // Rotate button
  const rotateBtn = document.createElement('button');
  rotateBtn.type = 'button';
  rotateBtn.title = 'Rotate 90°';
  rotateBtn.textContent = '⟳';
  rotateBtn.style.width = '50px';
  rotateBtn.style.height = '30px';
  rotateBtn.style.padding = '0';
  rotateBtn.style.fontSize = '18px';
  rotateBtn.style.borderRadius = '6px';
  rotateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pieceTransforms[piece.id].rotation = ((pieceTransforms[piece.id].rotation || 0) + 90) % 360;
    renderPiece(piece);
  });

  // Flip button
  const flipBtn = document.createElement('button');
  flipBtn.type = 'button';
  flipBtn.title = 'Flip (horizontal)';
  flipBtn.textContent = '⇋';
  flipBtn.style.width = '50px';
  flipBtn.style.height = '30px';
  flipBtn.style.padding = '0';
  flipBtn.style.fontSize = '18px';
  flipBtn.style.borderRadius = '6px';
  flipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pieceTransforms[piece.id].flippedH = !pieceTransforms[piece.id].flippedH;
    renderPiece(piece);
  });

  btnContainer.appendChild(rotateBtn);
  btnContainer.appendChild(flipBtn);
  pieceEl.appendChild(btnContainer);
}
