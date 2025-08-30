// solver.js
// Requires: pieces[], placedPieces, pieceTransforms, getTransformedShape(), renderPlacedPieces(), result element

// Global state
window.solutions = [];
window.currentSolutionIndex = null;
window.userPlacedPieces = null;
window.userPieceTransforms = null;
window.isViewingSolution = false;
window.stopAfterFirstSolution = true;

function disableBoardInteraction() {
    // Disable pointer events on board and pieces container
    const board = document.getElementById("board");
    const piecesContainer = document.getElementById("pieces");
    if (board) board.style.pointerEvents = "none";
    if (piecesContainer) piecesContainer.style.display = "none"; // Hide pieces container
}

function enableBoardInteraction() {
    const board = document.getElementById("board");
    const piecesContainer = document.getElementById("pieces");
    if (board) board.style.pointerEvents = "auto";
    if (piecesContainer) piecesContainer.style.display = "grid"; // Show pieces container
}

async function checkSolvability(findAll = false) {
    const overlay = document.getElementById("loading-overlay");
    overlay.style.display = "flex"; // show spinner

    try {
        if (!window.userPlacedPieces) {
            window.userPlacedPieces = JSON.parse(JSON.stringify(placedPieces || {}));
            window.userPieceTransforms = JSON.parse(JSON.stringify(pieceTransforms || {}));
        }

        if (Object.keys(window.userPlacedPieces).length === 0 && Object.keys(placedPieces || {}).length === 0) {
            overlay.style.display = "none";
            alert("Place at least one piece on the board before checking solvability.");
            return;
        }

        hideSolutionButtons();
        const checkBtn = document.getElementById("check-btn");
        if (checkBtn) checkBtn.style.display = "none";

        result.textContent = findAll ? "Finding all solutions..." : "Checking solvability...";
        result.style.color = "black";

        await new Promise(r => setTimeout(r, 50));

        const board = createBoardState();

        let unusedPieces = pieces
            .filter(p => !window.userPlacedPieces[p.id])
            .map(p => p.id);

        unusedPieces.sort((a, b) => {
            const asz = pieces.find(p => p.id === a).shape.length;
            const bsz = pieces.find(p => p.id === b).shape.length;
            return bsz - asz;
        });

        const solutions = [];
        const maxSolutions = 1000;
        window.stopAfterFirstSolution = !findAll;

        await backtrackAsync(board, unusedPieces, {}, solutions, maxSolutions);

        window.solutions = filterDuplicateSolutions(solutions);

        if (window.solutions.length === 0) {
            result.textContent = "No possible solution.";
            result.style.color = "red";
            hideSolutionButtons();
        } else {
            if (!findAll) {
                result.textContent = "Solvable!";
                result.style.color = "green";
            } else {
                result.textContent = `${window.solutions.length} solution(s) found.`;
                result.style.color = "green";
            }
            showViewSolutionsButton();
        }

        if (checkBtn) checkBtn.style.display = "inline-block";

    } finally {
        overlay.style.display = "none";
    }
}

// Modify backtrackAsync to respect stopAfterFirstSolution
async function backtrackAsync(board, remainingIds, currentPlacement, solutions, maxSolutions) {
    if (window.stopAfterFirstSolution && solutions.length >= 1) return;
    if (solutions.length >= maxSolutions) return;

    const rows = board.length;
    const cols = board[0].length;

    // Find first empty cell
    let found = false;
    let startR = -1, startC = -1;
    outer:
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === null) {
                startR = r;
                startC = c;
                found = true;
                break outer;
            }
        }
    }

    if (!found) {
        // Board full — record solution
        const fullSolution = {};
        const basePlaced = window.userPlacedPieces || {};
        for (const [id, { baseRow, baseCol }] of Object.entries(basePlaced)) {
            const transform = (window.userPieceTransforms && window.userPieceTransforms[id]) ||
                              (pieceTransforms[id] ? { ...pieceTransforms[id] } : { rotation: 0, flippedH: false, flippedV: false });
            fullSolution[id] = { baseRow, baseCol, transform: { ...transform } };
        }
        for (const [id, { baseRow, baseCol, transform }] of Object.entries(currentPlacement)) {
            fullSolution[id] = { baseRow, baseCol, transform: { ...transform } };
        }
        solutions.push(JSON.parse(JSON.stringify(fullSolution)));
        return;
    }

    const yieldIntervalMs = 10;
    let lastYield = performance.now();

    for (let idx = 0; idx < remainingIds.length; idx++) {
        const id = remainingIds[idx];
        const piece = pieces.find(p => p.id === id);

        for (const transform of piece.allowedTransforms) {
            const shape = getTransformedShape(piece.shape, transform);

            for (const [dxAnchor, dyAnchor] of shape) {
                const baseRow = startR - dyAnchor;
                const baseCol = startC - dxAnchor;

                if (!canPlace(board, shape, baseRow, baseCol)) continue;

                placePiece(board, shape, baseRow, baseCol, id);
                currentPlacement[id] = { baseRow, baseCol, transform: { ...transform } };

                const newRemaining = remainingIds.slice(0, idx).concat(remainingIds.slice(idx + 1));

                const prune = hasUnfillableRegion(board, newRemaining);
                if (!prune) {
                    await backtrackAsync(board, newRemaining, currentPlacement, solutions, maxSolutions);
                    if ((window.stopAfterFirstSolution && solutions.length >= 1) || solutions.length >= maxSolutions) {
                        placePiece(board, shape, baseRow, baseCol, null);
                        delete currentPlacement[id];
                        return;
                    }
                }

                placePiece(board, shape, baseRow, baseCol, null);
                delete currentPlacement[id];

                const now = performance.now();
                if (now - lastYield > yieldIntervalMs) {
                    lastYield = now;
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        }
    }
}

// Add Find All Solutions button
function showFindAllSolutionsButton() {
    let btn = document.getElementById("find-all-solutions-btn");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "find-all-solutions-btn";
        btn.textContent = "Find All Solutions";
        btn.addEventListener("click", async () => {
            await checkSolvability(true);
            toggleSolutionNavigation(window.solutions.length > 1, window.solutions.length);
            btn.style.display = "none";
        });
        const viewBtn = document.getElementById("view-solutions-btn");
        if (viewBtn) viewBtn.insertAdjacentElement("afterend", btn);
    }
    btn.style.display = "inline-block";
}


// Create board array from placedPieces (use userPlacedPieces snapshot if provided)
function createBoardState() {
    const rows = 5;
    const cols = 11;
    const board = Array.from({ length: rows }, () => Array(cols).fill(null));

    const basePlaced = window.userPlacedPieces || placedPieces || {};

    for (const [id, { baseRow, baseCol }] of Object.entries(basePlaced)) {
        const piece = pieces.find(p => p.id === id);
        const transform = (window.userPieceTransforms && window.userPieceTransforms[id]) || pieceTransforms[id];
        const shape = getTransformedShape(piece.shape, transform);

        shape.forEach(([dx, dy]) => {
            const r = baseRow + dy;
            const c = baseCol + dx;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                board[r][c] = id;
            } else {
                console.warn(`Pre-placed piece ${id} out of bounds at ${r},${c}`);
            }
        });
    }
    return board;
}

// Flood-fill based check for unfillable empty regions.
function hasUnfillableRegion(board, remainingIds) {
    const rows = board.length;
    const cols = board[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    const pieceSizes = remainingIds.map(id => pieces.find(p => p.id === id).shape.length);

    if (pieceSizes.length === 0) {
        // No pieces left but empty spaces remain -> unfillable
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                if (board[r][c] === null) return true;
        return false;
    }

    const minPieceSize = Math.min(...pieceSizes);

    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    let g = pieceSizes[0];
    for (let i = 1; i < pieceSizes.length; i++) g = gcd(g, pieceSizes[i]);

    function flood(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return 0;
        if (visited[r][c] || board[r][c] !== null) return 0;
        visited[r][c] = true;
        return 1 +
            flood(r-1, c) + flood(r+1, c) +
            flood(r, c-1) + flood(r, c+1);
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!visited[r][c] && board[r][c] === null) {
                const regionSize = flood(r, c);
                if (regionSize < minPieceSize) return true;
                if (g > 1 && (regionSize % g) !== 0) return true;
            }
        }
    }
    return false;
}

function getSolutionNavContainer() {
    let container = document.getElementById("solution-nav-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "solution-nav-container";
        container.style.display = "flex";
        container.style.gap = "10px";
        container.style.marginTop = "10px";
        container.style.flexDirection = "row";
        result.insertAdjacentElement("afterend", container);
    }
    return container;
}

function showViewSolutionsButton() {
    let btn = document.getElementById("view-solutions-btn");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "view-solutions-btn";
        btn.textContent = "View Solution";
        btn.addEventListener("click", () => {
            enterSolutionView(0);
        });
        result.insertAdjacentElement("afterend", btn);
    }
    btn.style.display = "inline-block";

    toggleSolutionNavigation(false);
    hideExitButton();
}

function showFindAllSolutionsButton() {
    let btn = document.getElementById("find-all-solutions-btn");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "find-all-solutions-btn";
        btn.textContent = "Find All Solutions";
        btn.addEventListener("click", async () => {
            await checkSolvability(true);

            // Immediately enter first solution view if any solutions exist
            if (window.solutions.length > 0) {
                enterSolutionView(0);
            }

            btn.style.display = "none";
        });
        const viewBtn = document.getElementById("view-solutions-btn");
        if (viewBtn) viewBtn.insertAdjacentElement("afterend", btn);
    }
    btn.style.display = "inline-block";
}

function enterSolutionView(index) {
    window.isViewingSolution = true;
    window.currentSolutionIndex = index;

    // Hide main buttons
    const checkBtn = document.getElementById("check-btn");
    const resetBtn = document.getElementById("reset-btn");
    const viewBtn = document.getElementById("view-solutions-btn");
    const findAllBtn = document.getElementById("find-all-solutions-btn");

    if (checkBtn) checkBtn.style.display = "none";
    if (resetBtn) resetBtn.style.visibility = "hidden";
    if (viewBtn) viewBtn.style.display = "none";
    if (findAllBtn) findAllBtn.style.display = "none";

    disableBoardInteraction();
    displaySolution(index);
    toggleSolutionNavigation(window.solutions.length > 1, window.solutions.length);
    createExitButton();
}

function createExitButton() {
    let exitBtn = document.getElementById("exit-solution-btn");
    if (!exitBtn) {
        exitBtn = document.createElement("button");
        exitBtn.id = "exit-solution-btn";
        exitBtn.textContent = "Exit View Solution";
        exitBtn.addEventListener("click", () => {
            window.isViewingSolution = false;
            toggleSolutionNavigation(false);
            exitBtn.style.display = "none";

            window.currentSolutionIndex = null;

            // Restore user-placed pieces if any
            if (window.userPlacedPieces && window.userPieceTransforms) {
                for (const key in placedPieces) delete placedPieces[key];
                for (const key in pieceTransforms) delete pieceTransforms[key];

                for (const key in window.userPlacedPieces) {
                    placedPieces[key] = { ...window.userPlacedPieces[key] };
                }
                for (const key in window.userPieceTransforms) {
                    pieceTransforms[key] = { ...window.userPieceTransforms[key] };
                }
            }

            renderPlacedPieces();

            // Show main buttons again
            const checkBtn = document.getElementById("check-btn");
            const resetBtn = document.getElementById("reset-btn");
            if (checkBtn) checkBtn.style.display = "inline-block";
            if (resetBtn) resetBtn.style.visibility = "visible";

            enableBoardInteraction();
            result.textContent = "";
            result.style.color = "";
        });
        result.insertAdjacentElement("afterend", exitBtn);
    }
    exitBtn.style.display = "inline-block";
}


function canPlace(board, shape, baseRow, baseCol) {
    for (const [dx, dy] of shape) {
        const r = baseRow + dy;
        const c = baseCol + dx;
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] !== null) return false;
    }
    return true;
}

function placePiece(board, shape, baseRow, baseCol, id) {
    for (const [dx, dy] of shape) {
        const r = baseRow + dy;
        const c = baseCol + dx;
        board[r][c] = id;
    }
}

function filterDuplicateSolutions(solutions) {
    const seen = new Set();
    const unique = [];

    for (const sol of solutions) {
        const grid = Array.from({ length: 5 }, () => Array(11).fill('.'));

        for (const [id, { baseRow, baseCol, transform }] of Object.entries(sol)) {
            const piece = pieces.find(p => p.id === id);
            const shape = getTransformedShape(piece.shape, transform);
            shape.forEach(([dx, dy]) => {
                const r = baseRow + dy;
                const c = baseCol + dx;
                if (r >= 0 && r < 5 && c >= 0 && c < 11) grid[r][c] = id;
            });
        }

        const normStr = grid.map(row => row.join(',')).join('|');

        if (!seen.has(normStr)) {
            seen.add(normStr);
            unique.push(sol);
        }
    }
    return unique;
}

function toggleSolutionNavigation(show, solutionCount = 0) {
    const container = getSolutionNavContainer();

    if (show && solutionCount > 1) {
        let prevBtn = document.getElementById("prev-solution-btn");
        if (!prevBtn) {
            prevBtn = document.createElement("button");
            prevBtn.id = "prev-solution-btn";
            prevBtn.textContent = "Previous Solution";
            prevBtn.addEventListener("click", () => {
                if (window.currentSolutionIndex > 0) {
                    displaySolution(window.currentSolutionIndex - 1);
                }
            });
            container.appendChild(prevBtn);
        }
        prevBtn.style.display = "inline-block";

        let nextBtn = document.getElementById("next-solution-btn");
        if (!nextBtn) {
            nextBtn = document.createElement("button");
            nextBtn.id = "next-solution-btn";
            nextBtn.textContent = "Next Solution";
            nextBtn.addEventListener("click", () => {
                if (window.currentSolutionIndex < window.solutions.length - 1) {
                    displaySolution(window.currentSolutionIndex + 1);
                }
            });
            container.appendChild(nextBtn);
        }
        nextBtn.style.display = "inline-block";
    } else {
        ["prev-solution-btn", "next-solution-btn"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }

    if (!show) {
        container.style.display = "none";
    } else {
        container.style.display = "flex";
    }
}

function hideSolutionButtons() {
    const ids = ["view-solutions-btn", "prev-solution-btn", "next-solution-btn", "exit-solution-btn"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    window.currentSolutionIndex = null;
    window.solutions = [];
}

function displaySolution(index) {
    if (!window.solutions || index < 0 || index >= window.solutions.length) return;
    window.currentSolutionIndex = index;

    for (const key in placedPieces) delete placedPieces[key];
    for (const key in pieceTransforms) delete pieceTransforms[key];

    const sol = window.solutions[index];
    for (const [id, { baseRow, baseCol, transform }] of Object.entries(sol)) {
        placedPieces[id] = { baseRow, baseCol };
        pieceTransforms[id] = { ...transform };
    }

    renderPlacedPieces();
    updateSolutionDisplayInfo();
}

function updateSolutionDisplayInfo() {
    result.textContent = `Showing solution ${window.currentSolutionIndex + 1} of ${window.solutions.length}`;
    result.style.color = "blue";
}

function hideExitButton() {
    const exitBtn = document.getElementById("exit-solution-btn");
    if (exitBtn) exitBtn.style.display = "none";
}

function resetSolutionsView() {
    if (window.isViewingSolution) {
      return;
    }
    window.solutions = [];
    window.currentSolutionIndex = null;
    const viewBtn = document.getElementById("view-solutions-btn");
    if (viewBtn) viewBtn.style.display = "none";
    hideSolutionButtons();
    result.textContent = "";
    result.style.color = "";
  }
